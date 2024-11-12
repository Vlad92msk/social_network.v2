import { EventEmitter } from 'events'
import {
  ConnectionManager,
  MediaStreamManager,
  MediaStreamOptions,
  NotificationManager,
  RoomInfo,
  RoomService,
  ScreenShareManager,
  SignalingConfig,
  SignalingService,
} from './micro-services'

interface ConferenceConfig {
  ice: RTCIceServer[]
  mediaConstraints: MediaStreamOptions
  signaling: SignalingConfig
}

/**
 * ConferenceService - главный оркестратор видеоконференции
 * Управляет взаимодействием всех сервисов и обработкой событий
 */
export class ConferenceService {
  readonly #notificationManager: NotificationManager

  readonly #roomService: RoomService

  readonly #mediaManager: MediaStreamManager

  readonly #screenShareManager: ScreenShareManager

  readonly #signalingService: SignalingService

  readonly #connectionManager: ConnectionManager

  #initialized = false

  #subscribers: Array<(state) => void> = []

  constructor() {
    this.#notificationManager = new NotificationManager()
    this.#roomService = new RoomService()
    this.#mediaManager = new MediaStreamManager()
    this.#screenShareManager = new ScreenShareManager()
    this.#signalingService = new SignalingService()
    this.#connectionManager = new ConnectionManager()
  }

  /**
   * Инициализация сервиса конференции
   */
  async initialize(config: ConferenceConfig): Promise<void> {
    try {
      console.log('🚀 Инициализация конференции...')

      if (this.#initialized) {
        await this.destroy()
      }

      // 1. Инициализируем менеджер соединений
      await this.#connectionManager.init({
        iceServers: config.ice,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'balanced',
      })

      // 2. Инициализируем медиа
      this.#mediaManager.init(config.mediaConstraints)

      // 3. Устанавливаем слушатели событий
      this.#setupSignalingEvents()
      this.#setupConnectionEvents()
      this.#setupMediaEvents()

      // 4. Подключаемся к сигнальному серверу
      await this.#signalingService.init(config.signaling)

      this.#initialized = true
      this.#notifySubscribers()
      console.log('✅ Конференция инициализирована')
    } catch (error) {
      const msg = 'Ошибка инициализации конференции'
      console.error('❌', msg, error)
      this.#notificationManager.notify('error', msg)
      throw error
    }
  }

  /**
   * Настройка событий сигнального сервера
   */
  #setupSignalingEvents(): void {
    // Подключение к конференции
    this.#signalingService.on('connected', () => {
      this.#notificationManager.notify('INFO', '✅ Подключение к конференции установлено')
      this.#notifySubscribers()
    })

    // Получение информации о комнате
    this.#signalingService.on('roomInfo', (roomInfo: RoomInfo) => {
      this.#roomService.initRoom(roomInfo)
      this.#notifySubscribers()
    })

    // Отключение от конференции
    this.#signalingService.on('disconnected', () => {
      this.#notificationManager.notify('WARNING', '⚠️ Отключение от конференции')
      this.#notifySubscribers()
    })

    // Обработка ошибок сигнального сервера
    this.#signalingService.on('error', (error: Error) => {
      this.#notificationManager.notify('ERROR', `❌ ${error.message}`)
      this.#notifySubscribers()
    })

    // Присоединение нового участника
    this.#signalingService.on('userJoined', async (userId: string) => {
      try {
        this.#checkInitialized()
        console.log(`👋 Новый участник: ${userId}`)

        // 1. Добавляем участника в комнату
        this.#roomService.addParticipant(userId)
        this.#notificationManager.notify('INFO', `✨ Пользователь ${userId} присоединился`)

        // 2. Создаем соединение и отправляем оффер
        await this.#connectionManager.createConnection(userId)
        const offer = await this.#createAndSendOffer(userId)
        this.#signalingService.sendOffer(userId, offer)

        // 3. Добавляем медиа потоки
        await this.#updateUserStreams(userId)
        this.#notifySubscribers()
      } catch (error) {
        console.error(`❌ Ошибка при подключении пользователя ${userId}:`, error)
        this.#notificationManager.notify('ERROR', 'Ошибка подключения пользователя')
      }
    })

    // Уход участника
    this.#signalingService.on('userLeft', (userId: string) => {
      console.log(`👋 Участник покинул конференцию: ${userId}`)
      this.#roomService.removeParticipant(userId)
      this.#connectionManager.closeConnection(userId)
      this.#notificationManager.notify('INFO', `Пользователь ${userId} покинул конференцию`)
      this.#notifySubscribers()
    })

    // Обработка SDP
    this.#signalingService.on('sdp', async ({ userId, description }) => {
      try {
        this.#checkInitialized()
        console.log(`📝 Получен ${description.type} от ${userId}`)

        if (description.type === 'offer') {
          // Получили оффер
          if (!this.#connectionManager.getConnection(userId)) {
            await this.#connectionManager.createConnection(userId)
          }

          const answer = await this.#connectionManager.handleOffer(userId, description)
          await this.#updateUserStreams(userId)
          this.#signalingService.sendAnswer(userId, answer)
        } else if (description.type === 'answer') {
          // Получили ответ
          await this.#connectionManager.handleAnswer(userId, description)
        }

        this.#notifySubscribers()
      } catch (error) {
        console.error('❌ Ошибка обработки SDP:', error)
        this.#notificationManager.notify('ERROR', 'Ошибка обработки медиа данных')
      }
    })

    // Обработка ICE кандидатов
    this.#signalingService.on('iceCandidate', async ({ userId, candidate }) => {
      if (!candidate) return

      try {
        await this.#connectionManager.addIceCandidate(userId, candidate)
      } catch (error) {
        console.error('❌ Ошибка добавления ICE кандидата:', error)
      }
    })
  }

  /**
   * Настройка событий WebRTC соединений
   */
  #setupConnectionEvents(): void {
    // Отправка ICE кандидатов
    this.#connectionManager.on('iceCandidate', ({ userId, candidate }) => {
      this.#signalingService.sendIceCandidate(userId, candidate)
    })

    // Обработка необходимости согласования
    this.#connectionManager.on('negotiationNeeded', async ({ userId, description }) => {
      try {
        console.log(`🔄 Требуется согласование с ${userId}`)
        this.#signalingService.sendOffer(userId, description)
      } catch (error) {
        console.error('❌ Ошибка согласования:', error)
        this.#notificationManager.notify('ERROR', 'Ошибка согласования медиа данных')
      }
    })

    // Изменение состояния соединения
    this.#connectionManager.on('connectionStateChanged', async ({ userId, state }) => {
      console.log(`🔄 Состояние соединения с ${userId}: ${state}`)

      if (state === 'failed') {
        this.#notificationManager.notify('WARNING', `⚠️ Проблемы с подключением к ${userId}`)
        await this.#updateUserStreams(userId)
      }
    })

    // Получение нового трека
    this.#connectionManager.on('track', ({ userId, stream, type }) => {
      if (stream.getVideoTracks().length > 0) {
        console.log(`📡 Получен видеопоток от ${userId} (${type})`)
        this.#roomService.addRemoteStream(userId, stream, type)
        this.#notifySubscribers()
      }
    })

    // Окончание трека
    this.#connectionManager.on('trackEnded', ({ userId, streamId, type }) => {
      console.log(`🛑 Завершен поток от ${userId} (${type})`)
      this.#roomService.removeRemoteStream(userId, streamId)
      this.#notifySubscribers()
    })
  }

  /**
   * Настройка событий медиа устройств
   */
  #setupMediaEvents(): void {
    const handleMediaChange = async () => {
      console.log('🔄 Обновление медиа потоков')
      for (const userId of this.#roomService.getParticipants()) {
        await this.#updateUserStreams(userId.userId)
      }
      this.#notifySubscribers()
    }

    // События камеры
    this.#mediaManager.on('streamStarted', handleMediaChange)
    this.#mediaManager.on('streamStopped', handleMediaChange)
    this.#mediaManager.on('videoToggled', handleMediaChange)
    this.#mediaManager.on('audioToggled', handleMediaChange)

    // События скриншеринга
    this.#screenShareManager.on('streamStarted', handleMediaChange)
    this.#screenShareManager.on('streamStopped', handleMediaChange)
  }

  /**
   * Обновление медиа потоков для пользователя
   */
  async #updateUserStreams(userId: string): Promise<void> {
    try {
      const { stream: cameraStream } = this.#mediaManager.getState()
      const { stream: screenStream } = this.#screenShareManager.getState()

      // 1. Удаляем старые потоки
      const existingStreams = this.#connectionManager.getStreams(userId)
      for (const { stream } of existingStreams) {
        await this.#connectionManager.removeStream(userId, stream.id)
      }

      // 2. Добавляем новые потоки
      if (cameraStream?.active) {
        await this.#connectionManager.addStream(userId, cameraStream, 'camera')
      }
      if (screenStream?.active) {
        await this.#connectionManager.addStream(userId, screenStream, 'screen')
      }
    } catch (error) {
      console.error(`❌ Ошибка обновления потоков для ${userId}:`, error)
      this.#notificationManager.notify('ERROR', 'Ошибка обновления медиа потоков')
    }
  }

  /**
   * Создание предложения для пользователя
   */
  async #createAndSendOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const connection = this.#connectionManager.getConnection(userId)
    if (!connection) {
      throw new Error(`Соединение не найдено для ${userId}`)
    }

    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
    return offer
  }

  /**
   * Публичные методы управления медиа
   */
  async startLocalStream(): Promise<void> {
    this.#checkInitialized()
    await this.#mediaManager.startStream()
  }

  stopLocalStream(): void {
    this.#checkInitialized()
    this.#mediaManager.stopStream()
  }

  toggleVideo(): void {
    this.#mediaManager.toggleVideo()
  }

  toggleAudio(): void {
    this.#mediaManager.toggleAudio()
  }

  async startScreenShare(): Promise<void> {
    this.#checkInitialized()
    await this.#screenShareManager.startScreenShare()
  }

  async stopScreenShare(): Promise<void> {
    this.#checkInitialized()
    this.#screenShareManager.stopScreenShare()
  }

  /**
   * Управление подписками на состояние
   */
  subscribe(callback: (state: any) => void): () => void {
    this.#subscribers.push(callback)
    callback(this.getState())
    return () => {
      this.#subscribers = this.#subscribers.filter((cb) => cb !== callback)
    }
  }

  #notifySubscribers(): void {
    const state = this.getState()
    this.#subscribers.forEach((callback) => callback(state))
  }

  /**
   * Получение текущего состояния
   */
  getState() {
    return {
      initialized: this.#initialized,
      media: this.#mediaManager.getState(),
      signaling: this.#signalingService.getState(),
      participants: this.#roomService.getParticipants(),
      streams: this.#roomService.getStreams(),
      localScreenShare: this.#screenShareManager.getState(),
    }
  }

  /**
   * Проверка инициализации
   */
  #checkInitialized(): void {
    if (!this.#initialized) {
      throw new Error('❌ Сервис конференции не инициализирован')
    }
  }

  /**
   * Уничтожение сервиса
   */
  async destroy(): Promise<void> {
    if (this.#initialized) {
      console.log('🧹 Завершение работы конференции')

      await Promise.all([
        this.#mediaManager.destroy(),
        this.#screenShareManager.destroy(),
        this.#connectionManager.destroy(),
        this.#signalingService.destroy(),
        this.#roomService.destroy(),
      ])

      this.#subscribers = []
      this.#initialized = false
      this.#notifySubscribers()
      console.log('✅ Конференция завершена')
    }
  }
}

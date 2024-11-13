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
  #config: ConferenceConfig

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

  async initialize(config: ConferenceConfig): Promise<void> {
    try {
      console.log('🚀 Инициализация конференции...')

      if (this.#initialized) {
        await this.destroy()
      }

      this.#config = config

      await this.#connectionManager.init({
        iceServers: config.ice,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'balanced',
      })

      this.#mediaManager.init(config.mediaConstraints)

      this.#setupSignalingEvents()
      this.#setupConnectionEvents()
      this.#setupMediaEvents()

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

  #setupSignalingEvents(): void {
    this.#signalingService.on('connected', () => {
      this.#notificationManager.notify('INFO', '✅ Подключение к конференции установлено')
      this.#notifySubscribers()
    })

    this.#signalingService.on('roomInfo', (roomInfo: RoomInfo) => {
      this.#roomService.initRoom(roomInfo)
      this.#notifySubscribers()
    })

    this.#signalingService.on('disconnected', () => {
      this.#notificationManager.notify('WARNING', '⚠️ Отключение от конференции')
      this.#notifySubscribers()
    })

    this.#signalingService.on('error', (error: Error) => {
      this.#notificationManager.notify('ERROR', `❌ ${error.message}`)
      this.#notifySubscribers()
    })

    this.#signalingService.on('userLeft', (userId: string) => {
      console.log(`👋 Участник покинул конференцию: ${userId}`)
      this.#roomService.removeParticipant(userId)
      this.#connectionManager.closeConnection(userId)
      this.#notificationManager.notify('INFO', `Пользователь ${userId} покинул конференцию`)
      this.#notifySubscribers()
    })

    // Упрощенная обработка присоединения пользователя
    this.#signalingService.on('userJoined', async (userId: string) => {
      try {
        console.log(`👋 Новый участник: ${userId}`)

        this.#roomService.addParticipant(userId)
        this.#notificationManager.notify('INFO', `✨ Пользователь ${userId} присоединился`)

        // Создаем соединение
        await this.#connectionManager.createConnection(userId)

        // Если у нас есть активные потоки - сразу отправляем их
        const { stream: cameraStream } = this.#mediaManager.getState()
        const { stream: screenStream } = this.#screenShareManager.getState()

        const streamToSend = screenStream?.active ? screenStream : cameraStream?.active ? cameraStream : null

        if (streamToSend) {
          console.log(`📤 Отправка существующего потока новому участнику ${userId}`)
          await this.#connectionManager.addStream(userId, streamToSend)
        }

        this.#notifySubscribers()
      } catch (error) {
        console.error(`❌ Ошибка при подключении пользователя ${userId}:`, error)
        this.#notificationManager.notify('ERROR', 'Ошибка подключения пользователя')
      }
    })

    // Упрощенная обработка SDP
    this.#signalingService.on('sdp', async ({ userId, description }) => {
      try {
        console.log(`📝 Получен ${description.type} от ${userId}`)

        if (description.type === 'offer') {
          if (!this.#connectionManager.getConnection(userId)) {
            await this.#connectionManager.createConnection(userId)
          }

          const answer = await this.#connectionManager.handleOffer(userId, description)

          // Отправляем существующие потоки после обработки оффера
          const { stream: cameraStream } = this.#mediaManager.getState()
          const { stream: screenStream } = this.#screenShareManager.getState()

          const streamToSend = screenStream?.active ? screenStream : cameraStream?.active ? cameraStream : null

          if (streamToSend) {
            console.log(`📤 Отправка существующего потока после оффера ${userId}`)
            await this.#connectionManager.addStream(userId, streamToSend)
          }

          this.#signalingService.sendAnswer(userId, answer)
        } else {
          await this.#connectionManager.handleAnswer(userId, description)
        }
      } catch (error) {
        console.error('❌ Ошибка обработки SDP:', error)
        this.#notificationManager.notify('ERROR', 'Ошибка обработки медиа данных')
      }
    })

    this.#signalingService.on('iceCandidate', async ({ userId, candidate }) => {
      if (!candidate) return

      try {
        await this.#connectionManager.addIceCandidate(userId, candidate)
      } catch (error) {
        console.error('❌ Ошибка добавления ICE кандидата:', error)
      }
    })
  }

  #setupConnectionEvents(): void {
    // Отправка ICE кандидатов
    this.#connectionManager.on('iceCandidate', ({ userId, candidate }) => {
      this.#signalingService.sendIceCandidate(userId, candidate)
    })

    // Обработка необходимости согласования
    this.#connectionManager.on('negotiationNeeded', ({ userId, description }) => {
      console.log(`🔄 Отправка оффера ${userId}`)
      this.#signalingService.sendOffer(userId, description)
    })

    // Получение нового трека
    this.#connectionManager.on('track', ({ userId, stream }) => {
      console.log(`📡 Получен поток от ${userId}`)
      this.#roomService.addRemoteStream(userId, stream)
      this.#notifySubscribers()
    })

    // Окончание трека
    this.#connectionManager.on('trackEnded', ({ userId, streamId }) => {
      console.log(`🛑 Завершен поток от ${userId}`)
      this.#roomService.removeRemoteStream(userId, streamId)
      this.#notifySubscribers()
    })

    // Изменение состояния соединения
    this.#connectionManager.on('connectionStateChanged', ({ userId, state }) => {
      console.log(`🔄 Состояние соединения с ${userId}: ${state}`)

      if (state === 'failed') {
        this.#notificationManager.notify('WARNING', `⚠️ Проблемы с подключением к ${userId}`)
      }
    })
  }

  #setupMediaEvents(): void {
    // Обработчик камеры
    this.#mediaManager.on('streamStarted', async () => {
      console.log('📹 Камера запущена')
      await this.#updateStreamsForAllParticipants()
    })

    this.#mediaManager.on('streamStopped', async () => {
      console.log('📹 Камера остановлена')
      await this.#updateStreamsForAllParticipants()
    })

    this.#mediaManager.on('videoToggled', async () => {
      console.log('📹 Видео переключено')
      await this.#updateStreamsForAllParticipants()
    })

    this.#mediaManager.on('audioToggled', async () => {
      console.log('🎤 Аудио переключено')
      await this.#updateStreamsForAllParticipants()
    })

    // Обработчик скриншеринга
    this.#screenShareManager.on('streamStarted', () => {
      console.log('🖥️ Скриншеринг запущен')
      this.#updateStreamsForAllParticipants()
    })

    this.#screenShareManager.on('streamStopped', () => {
      console.log('🖥️ Скриншеринг остановлен')
      this.#updateStreamsForAllParticipants()
    })
  }

  async #updateStreamsForParticipant(userId: string): Promise<void> {
    try {
      // Получаем активные потоки
      const { stream: cameraStream } = this.#mediaManager.getState()
      const { stream: screenStream } = this.#screenShareManager.getState()

      // Выбираем поток для отправки (приоритет у скриншеринга)
      const streamToSend = screenStream?.active ? screenStream : cameraStream?.active ? cameraStream : null

      console.log('streamToSend', streamToSend)
      if (streamToSend) {
        console.log(`📤 Отправка потока для ${userId}`)
        await this.#connectionManager.addStream(userId, streamToSend)
      }
    } catch (error) {
      console.error(`❌ Ошибка обновления потока для ${userId}:`, error)
      this.#notificationManager.notify('ERROR', `Ошибка обновления потока для ${userId}`)
    }
  }

  async #updateStreamsForAllParticipants(): Promise<void> {
    try {
      const participants = this.#roomService.getParticipants()
        .filter(({ userId }) => userId !== this.#config.signaling.userId)
console.log('participants', participants)
      console.log('🔄 Обновление потоков для участников:', participants.map((p) => p.userId))
      await Promise.all(participants.map(({ userId }) => this.#updateStreamsForParticipant(userId)))

      this.#notifySubscribers()
    } catch (error) {
      console.error('❌ Ошибка обновления потоков:', error)
      this.#notificationManager.notify('ERROR', 'Ошибка обновления медиа потоков')
    }
  }

  // Публичные методы управления медиа
  async startLocalStream(): Promise<void> {
    this.#checkInitialized()
    await this.#mediaManager.startStream()
  }

  stopLocalStream(): void {
    this.#checkInitialized()
    this.#mediaManager.stopStream()
  }

  async toggleVideo(): Promise<void> {
    await this.#mediaManager.toggleVideo()
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

  // Управление состоянием
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

  #checkInitialized(): void {
    if (!this.#initialized) {
      throw new Error('❌ Сервис конференции не инициализирован')
    }
  }

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

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

  #subscribers: Array<(state: any) => void> = []

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
      if (this.#initialized) await this.destroy()

      this.#config = config

      // Инициализируем сервисы
      await this.#connectionManager.init({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        iceCandidatePoolSize: 1,
      })

      this.#mediaManager.init(config.mediaConstraints)
      // Сначала настраиваем обработчик
      const roomInfoPromise = this.#waitForRoomInfo()

      // Потом инициализируем сигнальный сервис
      await this.#signalingService.init(config.signaling)

      // Ждем информацию о комнате
      const roomInfo = await roomInfoPromise

      this.#roomService.init(roomInfo)

      // Связываем события
      this.#setupEvents()

      this.#initialized = true
      this.#notifySubscribers()
      console.log('✅ Конференция инициализирована')
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error)
      this.#notificationManager.notify('error', 'Ошибка инициализации')
      throw error
    }
  }

  #waitForRoomInfo(): Promise<RoomInfo> {
    return new Promise((resolve) => {
      const handler = (info: RoomInfo) => {
        this.#signalingService.off('roomInfo', handler)
        resolve(info)
      }

      this.#signalingService.on('roomInfo', handler)
    })
  }

  #setupEvents(): void {
    // 1. События сигнального сервера
    this.#signalingService
      // Состояние подключения
      .on('connected', () => {
        console.log('✅ Подключено к сигнальному серверу')
      })
      .on('disconnected', () => {
        console.log('❌ Отключено от сигнального сервера')
        this.#notificationManager.notify('warning', 'Соединение потеряно')
      })
      .on('error', (error: Error) => { // Добавлен тип для error
        console.error('❌ Ошибка сигнального сервера:', error)
        this.#notificationManager.notify('error', 'Ошибка сервера')
      })
      .on('stateChanged', (state) => {
        console.log('🔄 Изменение состояния сигнального сервера:', state)
        this.#notifySubscribers()
      })

      // События участниковя
      .on('userJoined', async (userId: string) => {
        console.log('👋 Новый участник:', userId)
        this.#roomService.addParticipant(userId)
        try {
          // Сначала создаем соединение
          await this.#connectionManager.createConnection(userId)

          // Добавляем локальные медиа потоки, если они есть
          const { stream: localStream } = this.#mediaManager.getState()
          const { stream: screenShare } = this.#screenShareManager.getState()

          // Функция для добавления треков из потока
          const addStreamTracks = async (stream: MediaStream) => {
            const tracks = stream.getTracks()
            console.log(`📤 Добавление ${tracks.length} треков для потока:`, stream.id)
            await Promise.all(
              tracks.map((track) => this.#connectionManager.addTrack(userId, track, stream)),
            )
          }

          // Добавляем треки из обоих потоков, если они существуют
          if (localStream) {
            await addStreamTracks(localStream)
          }

          if (screenShare) {
            await addStreamTracks(screenShare)
          }

          // Создаем и отправляем offer
          const offer = await this.#connectionManager.createOffer(userId)
          if (offer) {
            await this.#signalingService.sendOffer(userId, offer)
            console.log('📨 Отправлен offer участнику:', userId)
          }
        } catch (error) {
          console.error('❌ Ошибка при создании соединения:', error)
          this.#notificationManager.notify('error', 'Ошибка подключения участника')
          this.#roomService.removeParticipant(userId)
          // Возможно стоит также закрыть соединение, если оно было создано
          this.#connectionManager.close(userId)
        }
      })
      .on('userLeft', (userId) => {
        console.log('👋 Участник покинул конференцию:', userId)
        // Сначала закрываем соединение
        this.#connectionManager.close(userId)
        // Затем очищаем данные участника
        this.#roomService.removeParticipant(userId)
        // Возможно очистка медиа-ресурсов
        // this.#mediaManager.cleanupUserResources(userId)
        this.#notifySubscribers()
      })
      .on('participantsUpdated', (participants) => {
        console.log('👥 Обновление списка участников:', participants)
        this.#notifySubscribers()
      })
      .on('sdp', async ({ userId, description }) => {
        if (!description) return

        try {
          if (description.type === 'offer') {
            console.log('📨 Получен offer от:', userId)

            // Проверяем/создаем соединение
            if (!this.#connectionManager.getConnection(userId)) {
              await this.#connectionManager.createConnection(userId)
            }

            const answer = await this.#connectionManager.handleOffer(userId, description)
            await this.#signalingService.sendAnswer(userId, answer)
            console.log('📨 Отправлен answer пользователю:', userId)
          } else if (description.type === 'answer') {
            console.log('📨 Получен answer от:', userId)
            await this.#connectionManager.handleAnswer(userId, description)
          }
        } catch (error) {
          console.error('❌ Ошибка обработки SDP:', error)
          this.#notificationManager.notify('error', 'Ошибка обмена данными')
        }
      })
      .on('iceCandidate', async ({ userId, candidate }) => {
        if (candidate) {
          try {
            console.log('📨 Получен ICE кандидат для:', userId)
            await this.#connectionManager.addIceCandidate(userId, candidate as RTCIceCandidate)
          } catch (error) {
            console.error('❌ Ошибка добавления ICE candidate:', error)
            // Возможно стоит добавить уведомление
            this.#notificationManager.notify('error', 'Ошибка установки соединения')
          }
        }
      })
      .on('userEvent', (event) => {
        console.log('👤 Событие участника:', event.type, 'от:', event.initiator)
        switch (event.type) {
          case 'mic-on':
          case 'mic-off':
          case 'camera-on':
          case 'camera-off':
            this.#notifySubscribers()
            break
          default:
            console.warn('Неизвестный тип события:', event.type) // Добавлена обработка неизвестных событий
        }
      })

    // 2. События WebRTC соединений
    this.#connectionManager
      .on('track', ({ userId, stream }) => {
        if (!userId || !stream) return
        this.#roomService.addStream(userId, stream)
        this.#notifySubscribers()
      })
      .on('trackEnded', ({ userId, trackId }) => {
        if (!userId || !trackId) return
        const participant = this.#roomService.getParticipant(userId)
        participant?.streams.forEach((stream) => {
          if (stream.getTracks()
            .some((track) => track.id === trackId)) {
            this.#roomService.removeStream(userId, stream.id)
          }
        })
        this.#notifySubscribers()
      })
      .on('negotiationNeeded', async ({ userId }) => {
        try {
          if (this.#connectionManager.isConnected(userId)) {
            const offer = await this.#connectionManager.createOffer(userId)
            if (offer) await this.#signalingService.sendOffer(userId, offer)
          }
        } catch (error) {
          console.error('❌ Ошибка создания offer:', error)
          this.#notificationManager.notify('error', 'Ошибка обновления соединения')
        }
      })
      .on('iceCandidate', async ({ userId, candidate }) => {
        if (candidate) {
          try {
            await this.#signalingService.sendIceCandidate(userId, candidate)
          } catch (error) {
            console.error('❌ Ошибка отправки ICE candidate:', error)
          }
        }
      })

    // 3. События медиа
    this.#mediaManager
      .on('streamStarted', async (stream: MediaStream, type: 'media' | 'screen') => {
        const participants = this.#roomService.getParticipants()
        console.log(`📤 Начало трансляции ${type === 'media' ? 'медиа' : 'экрана'}:`, stream.id)

        try {
          await Promise.all(participants.map(async (participant) => {
            const connection = this.#connectionManager.getConnection(participant.userId)
            if (connection) {
              await Promise.all(
                stream.getTracks().map((track) => {
                  console.log(`📤 Добавление трека ${track.kind} для участника:`, participant.userId)
                  return this.#connectionManager.addTrack(participant.userId, track, stream)
                }),
              )
            }
          }))
          this.#notifySubscribers()
        } catch (error) {
          console.error('❌ Ошибка добавления медиа треков:', error)
          this.#notificationManager.notify(
            'error',
            `Ошибка трансляции ${type === 'media' ? 'медиа' : 'экрана'}`,
          )
        }
      })
      .on('streamStopped', () => {
        this.#notifySubscribers()
      })
      .on('videoToggled', (event) => {
        this.#signalingService.sendEvent({
          type: event.active ? 'camera-on' : 'camera-off',
        })
        this.#notifySubscribers()
      })
      .on('audioToggled', (event) => {
        this.#signalingService.sendEvent({
          type: event.active ? 'mic-on' : 'mic-off',
        })
        this.#notifySubscribers()
      })

    // 4. События скриншеринга
    this.#screenShareManager
      .on('streamStarted', async (stream: MediaStream) => {
        const participants = this.#roomService.getParticipants()
        console.log('🖥️ Начало трансляции экрана:', stream.id)

        try {
          await Promise.all(participants.map(async (participant) => {
            const connection = this.#connectionManager.getConnection(participant.userId)
            if (connection) {
              await Promise.all(
                stream.getTracks().map((track) => {
                  console.log('🖥️ Добавление трека screen для участника:', participant.userId)
                  return this.#connectionManager.addTrack(participant.userId, track, stream)
                }),
              )
            }
          }))
          this.#notifySubscribers()
        } catch (error) {
          console.error('❌ Ошибка добавления треков скриншеринга:', error)
          this.#notificationManager.notify('error', 'Ошибка трансляции экрана')
        }
      })
      .on('streamStopped', async (stream: MediaStream) => {
        console.log('🖥️ Остановка трансляции экрана:', stream.id)

        try {
          const participants = this.#roomService.getParticipants()
          await Promise.all(participants.map(async (participant) => {
            const tracks = stream.getTracks()
            await Promise.all(
              tracks.map((track) => this.#connectionManager.removeTrack(participant.userId, track.id)),
            )
          }))
          this.#notifySubscribers()
        } catch (error) {
          console.error('❌ Ошибка удаления треков скриншеринга:', error)
          this.#notificationManager.notify('error', 'Ошибка остановки трансляции экрана')
        }
      })
      .on('error', (error: Error) => {
        console.error('❌ Ошибка скриншеринга:', error)
        this.#notificationManager.notify('error', 'Ошибка доступа к экрану')
      })

    this.#roomService.on('participantAdded', () => {
      this.#notifySubscribers()
    })
  }

  // Публичные методы управления конференцией
  async startLocalStream(): Promise<void> {
    this.#checkInitialized()
    await this.#mediaManager.startStream()
  }

  stopLocalStream(): void {
    this.#checkInitialized()
    this.#mediaManager.stopStream()
  }

  async startScreenShare(): Promise<void> {
    this.#checkInitialized()
    await this.#screenShareManager.startScreenShare()
  }

  async stopScreenShare(): Promise<void> {
    this.#checkInitialized()
    this.#screenShareManager.stopScreenShare()
  }

  async toggleVideo(): Promise<void> {
    await this.#mediaManager.toggleVideo()
  }

  toggleAudio(): void {
    this.#mediaManager.toggleAudio()
  }

  getState(): any {
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
    if (!this.#initialized) throw new Error('Сервис не инициализирован')
  }

  #notifySubscribers(): void {
    const state = this.getState()
    this.#subscribers.forEach((cb) => cb(state))
  }

  subscribe(callback: (state: any) => void): () => void {
    this.#subscribers.push(callback)
    callback(this.getState())
    return () => {
      this.#subscribers = this.#subscribers.filter((cb) => cb !== callback)
    }
  }

  async destroy(): Promise<void> {
    if (this.#initialized) {
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
    }
  }
}

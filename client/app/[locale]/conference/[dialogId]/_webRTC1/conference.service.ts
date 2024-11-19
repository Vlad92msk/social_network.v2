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
        try {
          this.#roomService.addParticipant(userId)

          const { stream: localStream } = this.#mediaManager.getState()
          const { stream: screenShare } = this.#screenShareManager.getState()

          if (localStream) {
            await this.handleStreamTracks(userId, localStream, this.#connectionManager, this.#signalingService)
          }

          if (screenShare) {
            await this.handleStreamTracks(userId, screenShare, this.#connectionManager, this.#signalingService)
          }
        } catch (error) {
          this.#notificationManager.notify('error', `❌ Ошибка подключения участника, ${error}`)
          this.#roomService.removeParticipant(userId)
          this.#connectionManager.close(userId)
        }
      })

      // Для динамических изменений
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

            if (!this.#connectionManager.getConnection(userId)) {
              await this.#connectionManager.createConnection(userId)
            }

            const answer = await this.#connectionManager.handleOffer(userId, description)
            await this.#signalingService.sendAnswer(userId, answer)
            console.log('📨 Отправлен answer пользователю:', userId)

            // Только потом отправляем свои стримы
            const { stream: localStream } = this.#mediaManager.getState()
            const { stream: screenShare } = this.#screenShareManager.getState()

            if (localStream || screenShare) {
              if (localStream) {
                await this.handleStreamTracks(userId, localStream, this.#connectionManager, this.#signalingService)
              }
              if (screenShare) {
                await this.handleStreamTracks(userId, screenShare, this.#connectionManager, this.#signalingService)
              }
            }
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
            this.#notifySubscribers()
          } catch (error) {
            console.error('❌ Ошибка добавления ICE candidate:', error)
            this.#notificationManager.notify('error', 'Ошибка установки соединения')
          }
        }
      })
      .on('userEvent', (event) => {
        console.log('👤 Событие участника:', event.event.type, 'от:', event.initiator, event)
        switch (event.event.type) {
          case 'screen-share-off': {
            this.#roomService.removeStream(event.initiator, event.event.payload.streamId)
            break
          }
          case 'camera-off': {
            this.#roomService.removeStream(event.initiator, event.event.payload.streamId)
            break
          }
          case 'mic-on':
          case 'mic-off':
          case 'camera-on':
          default:
            console.warn('Неизвестный тип события:', event.type) // Добавлена обработка неизвестных событий
        }
        this.#notifySubscribers()
      })

    // 2. События WebRTC соединений
    this.#connectionManager
      .on('track', ({ userId, track, stream }) => {
        if (!userId || !stream) return

        // Добавляем поток в RoomService
        this.#roomService.addStream(userId, stream)

        // Запрашиваем состояние room service после добавления
        const participant = this.#roomService.getParticipant(userId)
        console.log('📊 Состояние участника после добавления потока:', {
          userId,
          streamsCount: participant?.streams.size,
          streams: Array.from(participant?.streams || []).map((s) => s.id),
        })

        this.#notifySubscribers()
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
      .on('connectionLost', async ({ userId }) => {
        console.log(`❌ Потеряно соединение с ${userId}`)

        // Очищаем ресурсы
        this.#connectionManager.close(userId)
        this.#roomService.removeParticipant(userId)

        // Уведомляем сигнальный сервер
        this.#signalingService.sendEvent({
          // @ts-ignore
          type: 'user-disconnected',
          userId,
        })
      })

    // 3. События медиа
    this.#mediaManager
      .on('streamStarted', async (stream: MediaStream) => {
        const participants = this.#roomService.getParticipants()
          .filter(({ userId }) => userId !== this.#config.signaling.userId)

        try {
          await Promise.all(
            participants.map(({ userId }) => this.handleStreamTracks(userId, stream, this.#connectionManager, this.#signalingService)),
          )
        } catch (error) {
          console.error('❌ Ошибка добавления медиа треков:', error)
          this.#notificationManager.notify('error', 'Ошибка трансляции с камеры')
        }
      })
      .on('streamStopped', ({ streamId }: { streamId: string }) => {
        this.#signalingService.sendEvent({
          type: 'camera-off',
          payload: { streamId },
        })
      })
      .on('videoToggled', ({ streamId, active }: { active: boolean, streamId: string }) => {
        this.#signalingService.sendEvent({
          type: active ? 'camera-on' : 'camera-off',
          payload: { streamId },
        })
      })
      .on('audioToggled', ({ streamId, active }: { active: boolean, streamId: string }) => {
        this.#signalingService.sendEvent({
          type: active ? 'mic-on' : 'mic-off',
          payload: { streamId },
        })
      })
      .on('stateChanged', () => {
        this.#notifySubscribers()
      })

    // 4. События скриншеринга
    this.#screenShareManager
      .on('streamStarted', async (stream: MediaStream) => {
        const participants = this.#roomService.getParticipants()
          .filter(({ userId }) => userId !== this.#config.signaling.userId)

        try {
          await Promise.all(
            participants.map(({ userId }) => this.handleStreamTracks(userId, stream, this.#connectionManager, this.#signalingService)),
          )
        } catch (error) {
          console.error('❌ Ошибка добавления треков скриншеринга:', error)
          this.#notificationManager.notify('error', 'Ошибка трансляции экрана')
        }
      })
      .on('streamStopped', async ({ streamId }: { streamId: string }) => {
        console.log('🖥️ Остановка трансляции экрана:', streamId)

        this.#signalingService.sendEvent({
          type: 'screen-share-off',
          payload: { streamId },
        })
      })
      .on('error', (error: Error) => {
        console.error('❌ Ошибка скриншеринга:', error)
        this.#notificationManager.notify('error', 'Ошибка доступа к экрану')
      })
      .on('stateChanged', () => {
        this.#notifySubscribers()
      })

    this.#roomService.on('participantAdded', () => {
      this.#notifySubscribers()
    })
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

  private async handleStreamTracks(
    userId: string,
    stream: MediaStream,
    connectionManager: ConnectionManager,
    signalingService: SignalingService,
  ): Promise<void> {
    // Создаем/проверяем соединение
    if (!connectionManager.getConnection(userId)) {
      await connectionManager.createConnection(userId)
    }

    // Добавляем треки
    await Promise.all(
      stream.getTracks().map((track) => connectionManager.addTrack(userId, track, stream)),
    )

    // Создаем offer после добавления всех треков
    const offer = await connectionManager.createOffer(userId)
    if (offer) {
      await signalingService.sendOffer(userId, offer)
    }
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
    if (!this.#initialized) throw new Error('Сервис не инициализирован')
  }

  #notifySubscribers(): void {
    const state = this.getState()
    console.log('__STATE___', state)
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

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
import { UserInfo } from '../../../../../../swagger/userInfo/interfaces-userInfo'

export interface ConferenceConfig {
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

  async initialize(config: ConferenceConfig) {
    try {
      console.log('🚀 Инициализация конференции...')
      if (this.#initialized) await this.destroy()

      this.#config = config

      await this.#connectionManager.init({
        iceServers: config.ice,
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

  #setupEvents() {
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
        // this.#notifySubscribers()
      })

      // События участниковя
      .on('userJoined', async (user: UserInfo) => {
        try {
          this.#roomService.addParticipant(user)

          const { stream: localStream } = this.#mediaManager.getState()
          const { stream: screenShare } = this.#screenShareManager.getState()

          const streams = [localStream, screenShare].filter(Boolean) as MediaStream[]
          if (streams.length > 0) {
            await this.handleStreamTracks(String(user.id), streams, this.#connectionManager, this.#signalingService)
          }
        } catch (error) {
          this.#notificationManager.notify('error', `❌ Ошибка подключения участника, ${error}`)
          this.#roomService.removeParticipant(String(user.id))
          this.#connectionManager.close(String(user.id))
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

            const streams = [localStream, screenShare].filter(Boolean) as MediaStream[]
            if (streams.length > 0) {
              await this.handleStreamTracks(userId, streams, this.#connectionManager, this.#signalingService)
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
          case 'screen-share-on': {
            this.#roomService.setStreamType(
              event.initiator,
              event.event.payload.streamId,
              'screen',
            )
            break
          }
          case 'screen-share-off': {
            this.#roomService.removeStream(event.initiator, event.event.payload.streamId)
            break
          }
          case 'camera-off': {
            this.#roomService.onCameraOff(event.initiator)
            break
          }
          case 'mic-off': {
            this.#roomService.muteParticipantAudio(event.initiator)
            break
          }
          case 'mic-on': {
            this.#roomService.unmuteParticipantAudio(event.initiator)
            break
          }
          case 'camera-on': {
            this.#roomService.setStreamType(
              event.initiator,
              event.event.payload.streamId,
              'camera',
            )
            break
          }
          default:
            console.warn('Неизвестный тип события:', event.type) // Добавлена обработка неизвестных событий
            break
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
      })
      .on('trackEnded', async ({ userId, trackId }) => {
        console.log(`trackEnded ${userId}, ${trackId}`)
      })

    // 3. События медиа
    this.#mediaManager
      .on('streamStarted', async (stream: MediaStream) => {
        const participants = this.#roomService.getParticipants()
          .filter(({ userId }) => userId !== this.#config.signaling.userId)

        try {
          await Promise.all(
            participants.map(({ userId }) => this.handleStreamTracks(userId, [stream], this.#connectionManager, this.#signalingService)),
          )
          this.#signalingService.sendEvent({
            type: 'camera-on',
            payload: { streamId: stream.id },
          })
          this.#notifySubscribers()
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
        this.#notifySubscribers()
      })
      .on('audioToggled', ({ streamId, active }: { active: boolean, streamId: string }) => {
        this.#signalingService.sendEvent({
          type: active ? 'mic-on' : 'mic-off',
          payload: { streamId },
        })
        this.#notifySubscribers()
      })
      .on('toggleVideo', ({ streamId, type }: { type: 'camera-on' | 'camera-off', streamId: string }) => {
        this.#signalingService.sendEvent({
          type,
          payload: { streamId },
        })
        this.#notifySubscribers()
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
            participants.map(({ userId }) => this.handleStreamTracks(userId, [stream], this.#connectionManager, this.#signalingService)),
          )
          this.#signalingService.sendEvent({
            type: 'screen-share-on',
            payload: { streamId: stream.id },
          })
          this.#notifySubscribers()
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
        this.#notifySubscribers()
      })
      .on('error', (error: Error) => {
        console.error('❌ Ошибка скриншеринга:', error)
        this.#notificationManager.notify('error', 'Ошибка доступа к экрану')
      })
      .on('stateChanged', () => {
        this.#notifySubscribers()
      })

    this.#roomService
      .on('participantAdded', ({ user }: { user: UserInfo }) => {
        this.#notificationManager.notify('INFO', `Пользователь ${user.name} присоединился к конференции`)
        this.#notifySubscribers()
      })
      .on('participantRemoved', ({ user }: { user: UserInfo }) => {
        this.#notificationManager.notify('INFO', `Пользователь ${user.name} покинул конференцию`)
        this.#notifySubscribers()
      })
      .on('participantAudioUnmuted', () => {
        this.#notifySubscribers()
      })
      .on('participantAudioMuted', () => {
        this.#notifySubscribers()
      })
      .on('onCameraOff', () => {
        console.log('onCameraOff')
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

  async handleStreamTracks(
    userId: string,
    streams: MediaStream[],
    connectionManager: ConnectionManager,
    signalingService: SignalingService,
  ) {
    // Create/check connection
    if (!connectionManager.getConnection(userId)) {
      await connectionManager.createConnection(userId)
    }

    // Add all tracks from all streams
    await Promise.all(
      streams.flatMap((stream) => stream.getTracks().map((track) => connectionManager.addTrack(userId, track, stream))),
    )

    // Create single offer after adding all tracks
    const offer = await connectionManager.createOffer(userId)
    if (offer) {
      await signalingService.sendOffer(userId, offer)
    }
  }

  // Публичные методы управления конференцией
  async startLocalStream() {
    this.#checkInitialized()
    await this.#mediaManager.startStream()
  }

  stopLocalStream(): void {
    this.#checkInitialized()
    this.#mediaManager.stopStream()
  }

  async startScreenShare() {
    this.#checkInitialized()
    await this.#screenShareManager.startScreenShare()
  }

  async stopScreenShare() {
    this.#checkInitialized()
    this.#screenShareManager.stopScreenShare()
  }

  async toggleVideo() {
    await this.#mediaManager.toggleVideo()
  }

  async toggleAudio() {
    await this.#mediaManager.toggleAudio()
  }

  getState() {
    return {
      initialized: this.#initialized,
      media: this.#mediaManager.getState(),
      signaling: this.#signalingService.getState(),
      participants: this.#roomService.getParticipants(),
      localScreenShare: this.#screenShareManager.getState(),
      currentUser: this.#roomService.getCurrentUser(),
    }
  }

  #checkInitialized() {
    if (!this.#initialized) throw new Error('Сервис не инициализирован')
  }

  #notifySubscribers() {
    const state = this.getState()
    console.log('__STATE___', state)
    this.#subscribers.forEach((cb) => cb(state))
  }

  subscribe(callback: (state: any) => void) {
    this.#subscribers.push(callback)
    callback(this.getState())
    return () => {
      this.#subscribers = this.#subscribers.filter((cb) => cb !== callback)
    }
  }

  async destroy() {
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

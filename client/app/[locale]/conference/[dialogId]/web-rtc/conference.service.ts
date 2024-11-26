import { EventEmitter } from 'events'
import {
  ConnectionManager, ConnectionState,
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
export class ConferenceService extends EventEmitter {
  private readonly notificationManager: NotificationManager

  private readonly roomService: RoomService

  private readonly mediaManager: MediaStreamManager

  private readonly screenShareManager: ScreenShareManager

  private readonly signalingService: SignalingService

  private readonly connectionManager: ConnectionManager

  private config: ConferenceConfig

  // Храним маппинг для отслеживания типов потоков
  private streamTypes = new Map<string, { userId: string, type: 'camera' | 'screen' }>()

  private subscribers: Array<(state: any) => void> = []

  private initialized = false

  constructor() {
    super()
    this.notificationManager = new NotificationManager()
    this.roomService = new RoomService()
    this.mediaManager = new MediaStreamManager()
    this.screenShareManager = new ScreenShareManager()
    this.signalingService = new SignalingService()
    this.connectionManager = new ConnectionManager()
  }

  async initialize(config: ConferenceConfig): Promise<void> {
    try {
      if (this.initialized) {
        await this.destroy()
      }

      this.config = config

      // Инициализируем все сервисы
      await this.connectionManager.init({
        iceServers: config.ice,
        iceTransportPolicy: 'all',
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 10,
      })
      await this.mediaManager.init(config.mediaConstraints)

      // Сначала настраиваем обработчик
      const roomInfoPromise = this.#waitForRoomInfo()

      await this.signalingService.init(config.signaling)

      // Ждем информацию о комнате
      const roomInfo = await roomInfoPromise

      this.roomService.init(roomInfo)

      // Устанавливаем обработчики событий
      this.#setupEvents()

      this.initialized = true
      this.notifySubscribers()
      this.emit('initialized')
    } catch (error) {
      this.notificationManager.notify('error', 'Ошибка инициализации конференции')
      throw error
    }
  }

  #setupEvents() {
    // 1. События сигнального сервера
    this.signalingService
      // Обработка подключения нового участника
      .on('userJoined', (user: UserInfo) => this.handleUserJoined(user))
      // Обработка отключения участника
      .on('userLeft', (userId) => {
        console.log('Участник отключился:', userId)
        this.connectionManager.closeConnection(userId)
        this.roomService.removeParticipant(userId)
        this.notifySubscribers()
      })
      // Обработка SDP сообщений
      .on('sdp', async ({ userId, description }) => {
        if (!description) return

        try {
          // console.log('Получено SDP:', { userId, type: description.type })

          if (description.type === 'offer') {
            console.log('Получили offer')
            console.log('Есть соединение?', this.connectionManager.hasConnection(userId))
            // Создаем соединение при получении offer если его нет
            if (!this.connectionManager.hasConnection(userId)) {
              console.log('Создаем создание соединения')
              await this.connectionManager.createConnection(userId)
              console.log('Соединение создано')
            }

            console.log('Соединение answer')
            // Обрабатываем offer и отправляем answer
            const answer = await this.connectionManager.handleOffer(userId, description)
            console.log('answer создан')
            await this.signalingService.sendAnswer(userId, answer)
            console.log('answer отправлен')
          } else if (description.type === 'answer') {
            console.log('Получили answer')
            await this.connectionManager.handleAnswer(userId, description)
            console.log('Выполнили handleAnswer')
          }
        } catch (error) {
          console.error('Ошибка обработки SDP:', error)
          this.notificationManager.notify('error', 'Ошибка установки соединения')
        }
      })
      // Обработка ICE кандидатов
      .on('iceCandidate', async ({ userId, candidate }) => {
        console.log(`[ICE] Получили кандидата от пользователя ${userId}`, {
          type: candidate.type,
          protocol: candidate.protocol,
        })
        if (candidate) {
          await this.connectionManager.addIceCandidate(userId, candidate)
          console.log(`[ICE] Кандидат успешно добавлен для ${userId}`)
        }
      })

    // 2. События WebRTC соединений
    this.connectionManager
      .on('track', ({ userId, track, stream }) => {
        // Определяем тип потока
        const streamType = track.kind === 'video' && track.label?.includes('screen')
          ? 'screen'
          : 'camera'

        // Сохраняем тип потока
        this.streamTypes.set(stream.id, { userId, type: streamType })

        this.roomService.addStream(userId, stream, streamType)
        this.notifySubscribers()
      })
      .on('trackEnded', ({ userId, track, stream }) => {
        // Получаем тип потока из сохраненного маппинга
        const streamInfo = this.streamTypes.get(stream.id)
        if (streamInfo) {
          this.roomService.removeStream(userId, streamInfo.type)
          // Удаляем информацию о потоке
          this.streamTypes.delete(stream.id)
        }
        this.notifySubscribers()
      })
      .on('iceCandidate', async ({ userId, candidate }) => {
        console.log(`[ICE] Отправляем кандидата пользователю ${userId}`, {
          type: candidate.type,
          protocol: candidate.protocol,
        })
        await this.signalingService.sendIceCandidate(userId, candidate)
      })
      .on('negotiationNeeded', async ({ userId, offer }) => {
        try {
          if (offer) {
            // Отправляем offer через сигнальный сервис
            await this.signalingService.sendOffer(userId, offer)
          }
        } catch (error) {
          console.error('Ошибка отправки offer при перепереговорах:', error)
          this.notificationManager.notify('error', 'Ошибка обновления соединения')
        }
      })
      .on('error', ({ userId, error }) => {
        console.error(`Ошибка соединения с ${userId}:`, error)
        this.notificationManager.notify('error', 'Ошибка соединения')
      })
      .on('connectionState', ({ userId, state }: { userId: string, state: 'new' | 'disconnected' | 'failed' | 'closed' | 'checking' | 'completed' }) => {
        console.log(`Соединение с пользователем: ${userId} - ${state}`)
      })
      .on('iceState', ({ userId, state }: { userId: string, state: ConnectionState }) => {
        console.log(`ICE state: ${state}`)

        // @ts-ignore
        if (state === 'connected' || state === 'completed') {
          console.log(`Соединение с пользователем: ${userId} успешно установлено`)
        }
      })

    // 3. События камеры
    this.mediaManager.on('stateChanged', async (state: ReturnType<MediaStreamManager['getState']>) => {
      this.notifySubscribers()

      const participants = this.roomService.getParticipants()
        .filter((p) => p.userId !== this.config.signaling.userId)

      if (state.stream) {
        // Проверяем есть ли треки в соединениях
        await Promise.all(
          participants.map(async (participant) => {
            const senders = this.connectionManager.getSenders(participant.userId)

            // Для видео
            if (state.hasVideo) {
              const videoTrack = state.stream?.getVideoTracks()[0]
              const videoSender = senders.find((s) => s.track?.kind === 'video')

              if (videoTrack) {
                if (!videoSender) {
                  // Если трека нет в соединении - добавляем
                  await this.connectionManager.addTrack(participant.userId, videoTrack, state.stream!)
                } else {
                  // Если трек есть - просто обновляем его состояние
                  if (videoSender.track) {
                    videoSender.track.enabled = state.isVideoEnabled
                  }
                }
              }
            }

            // Для аудио
            if (state.hasAudio) {
              const audioTrack = state.stream?.getAudioTracks()[0]
              const audioSender = senders.find((s) => s.track?.kind === 'audio')

              if (audioTrack) {
                if (!audioSender) {
                  // Если трека нет в соединении - добавляем
                  await this.connectionManager.addTrack(participant.userId, audioTrack, state.stream!)
                } else {
                  // Если трек есть - просто обновляем его состояние
                  if (audioSender.track) {
                    audioSender.track.enabled = state.isAudioEnabled
                  }
                }
              }
            }
          }),
        )

        // Отправляем события об изменении состояния
        this.signalingService.sendEvent({
          type: state.isVideoEnabled ? 'camera-on' : 'camera-off',
          payload: { streamId: state.stream.id },
        })

        this.signalingService.sendEvent({
          type: state.isAudioEnabled ? 'mic-on' : 'mic-off',
          payload: { streamId: state.stream.id },
        })
      }
    })

    // 4. События трансляции экрана
    this.screenShareManager.on('stateChanged', async (state) => {
      this.notifySubscribers()

      const participants = this.roomService.getParticipants()
        .filter((p) => p.userId !== this.config.signaling.userId)

      if (state.stream) {
        if (state.isActive) {
          // Добавляем треки трансляции экрана
          await Promise.all(
            state.stream.getTracks().flatMap((track) => participants.map((participant) => this.connectionManager.addTrack(participant.userId, track, state.stream))),
          )

          this.signalingService.sendEvent({
            type: 'screen-share-on',
            payload: { streamId: state.stream.id },
          })
        } else {
          // Удаляем треки трансляции экрана
          await Promise.all(
            state.stream.getTracks().flatMap((track) => participants.map((participant) => this.connectionManager.removeTrack(participant.userId, track.id))),
          )

          this.signalingService.sendEvent({
            type: 'screen-share-off',
            payload: { streamId: state.stream.id },
          })
        }
      }
    })
  }

  private async handleUserJoined(user: UserInfo): Promise<void> {
    try {
      console.log('Новый участник:', user.id)

      // Добавляем участника в RoomService
      this.roomService.addParticipant(user)
      const userId = String(user.id)

      // Создаём peer соединение в любом случае
      await this.connectionManager.createConnection(userId)
      console.log('Создано соединение для:', user.id)

      // Если есть активные потоки - отправляем их
      const mediaStream = this.mediaManager.getStream()
      const { stream: screenStream } = this.screenShareManager.getState()
      const streams = [mediaStream, screenStream].filter(Boolean) as MediaStream[]

      if (streams.length > 0) {
        console.log('Отправка существующих потоков новому участнику:', user.id)
        // Добавляем все треки из всех потоков
        await Promise.all(
          streams.flatMap((stream) => stream.getTracks().map((track) => this.connectionManager.addTrack(userId, track, stream))),
        )
      }

      // Создаем и отправляем offer
      const offer = await this.connectionManager.createOffer(userId)
      if (offer) {
        await this.signalingService.sendOffer(userId, offer)
        console.log('отправлен offer', userId)
      }

      this.notifySubscribers()
    } catch (error) {
      console.error('Ошибка при подключении участника:', error)
      this.notificationManager.notify('error', 'Ошибка подключения участника')
    }
  }

  #waitForRoomInfo(): Promise<RoomInfo> {
    return new Promise((resolve) => {
      const handler = (info: RoomInfo) => {
        this.signalingService.off('roomInfo', handler)
        resolve(info)
      }

      this.signalingService.on('roomInfo', handler)
    })
  }

  // Включение/выключение камеры
  async toggleVideo(): Promise<void> {
    try {
      await this.mediaManager.toggleVideo()
      this.notifySubscribers()
    } catch (error) {
      console.error('Ошибка в toggleVideo:', error)
      this.notificationManager.notify('error', 'Ошибка управления камерой')
    }
  }

  // Включение/выключение микрофона
  async toggleAudio(): Promise<void> {
    try {
      this.#checkInitialized()
      await this.mediaManager.toggleAudio()
    } catch (error) {
      console.error('Ошибка в toggleAudio:', error)
      this.notificationManager.notify('error', 'Ошибка управления микрофоном')
    }
  }

  async startScreenShare(): Promise<void> {
    try {
      this.#checkInitialized()
      await this.screenShareManager.startScreenShare()
    } catch (error) {
      console.error('Ошибка запуска демонстрации экрана:', error)
      this.notificationManager.notify('error', 'Ошибка запуска демонстрации экрана')
    }
  }

  async stopScreenShare(): Promise<void> {
    try {
      this.#checkInitialized()
      await this.screenShareManager.stopScreenShare()
    } catch (error) {
      console.error('Ошибка остановки демонстрации экрана:', error)
      this.notificationManager.notify('error', 'Ошибка остановки демонстрации экрана')
    }
  }

  // Полное отключение видео (когда нужно не просто выключить, а удалить трек)
  async stopVideo() {
    const { stream } = this.mediaManager.getState()
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        // Удаляем видео трек из всех соединений
        const participants = this.roomService.getParticipants()
        await Promise.all(
          participants.map((p) => this.connectionManager.removeTrack(p.userId, videoTrack.id)),
        )
      }
    }
  }

  /**
   * Получение списка доступных устройств
   * const devices = await conferenceService.getAvailableDevices();
   * Когда пользователь выбирает новое устройство:
   *   await conferenceService.switchCamera(selectedDeviceId);
   * или
   *   await conferenceService.switchMicrophone(selectedDeviceId);
   */
  async getAvailableDevices() {
    return {
      video: await this.mediaManager.getVideoDevices(),
      audio: await this.mediaManager.getAudioDevices(),
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    try {
      await this.mediaManager.createVideoTrack(deviceId)
    } catch (error) {
      this.notificationManager.notify('error', 'Ошибка переключения камеры')
      throw error
    }
  }

  async switchMicrophone(deviceId: string): Promise<void> {
    try {
      await this.mediaManager.createAudioTrack(deviceId)
    } catch (error) {
      this.notificationManager.notify('error', 'Ошибка переключения микрофона')
      throw error
    }
  }

  /**
   * Получение подробной информации о соединении с конкретным участником
   *   const connectionInfo = await conferenceService.getParticipantConnectionInfo(userId);
   *   console.log('Состояние соединения:', connectionInfo.status);
   *   console.log('Статистика:', connectionInfo.stats);
   */
  async getParticipantConnectionInfo(userId: string) {
    return {
      status: {
        signaling: this.connectionManager.getSignalingState(userId),
        ice: this.connectionManager.getIceConnectionState(userId),
        isConnected: this.connectionManager.isConnected(userId),
      },
      tracks: {
        senders: this.connectionManager.getSenders(userId),
        receivers: this.connectionManager.getReceivers(userId),
      },
      stats: await this.connectionManager.getStats(userId),
    }
  }

  subscribe(callback: (state: any) => void) {
    this.subscribers.push(callback)
    callback(this.getState())
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback)
    }
  }

  private notifySubscribers() {
    const state = this.getState()
    console.log('__STATE__', state)
    this.subscribers.forEach((cb) => cb(state))
  }

  #checkInitialized() {
    if (!this.initialized) throw new Error('Сервис не инициализирован')
  }

  // Получение состояния конференции
  getState() {
    return {
      currentUser: this.roomService.getCurrentUser(),
      roomInfo: this.roomService.getState(),
      participants: this.roomService.getParticipants(),
      localMedia: this.mediaManager.getState(),
      screenShare: this.screenShareManager.getState(),
      connections: this.connectionManager.getConnections?.() || [],
    }
  }

  async destroy(): Promise<void> {
    this.connectionManager.destroy()
    this.mediaManager.destroy()
    this.screenShareManager.destroy()
    this.signalingService.destroy()
    this.roomService.destroy()
    this.removeAllListeners()
    this.initialized = false
  }
}

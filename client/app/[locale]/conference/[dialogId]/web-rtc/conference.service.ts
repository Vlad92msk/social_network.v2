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
import { UserInfo } from '../../../../../../swagger/userInfo/interfaces-userInfo'

function ensureInitialized(target, name, descriptor) {
  const original = descriptor.value
  descriptor.value = async function (...args) {
    if (!this.initialized) {
      throw new Error('Service not initialized')
    }
    return await original.apply(this, args)
  }
  return descriptor
}

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
      await this.connectionManager.init({ iceServers: config.ice })
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
          console.log('Получено SDP:', { userId, type: description.type });

          if (description.type === 'offer') {
            // Создаем соединение при получении offer если его нет
            if (!this.connectionManager.hasConnection(userId)) {
              console.log('Создание соединения при получении offer');
              await this.connectionManager.createConnection(userId);
            }

            // Обрабатываем offer и отправляем answer
            const answer = await this.connectionManager.handleOffer(userId, description);
            await this.signalingService.sendAnswer(userId, answer);
          } else if (description.type === 'answer') {
            await this.connectionManager.handleAnswer(userId, description);
          }
        } catch (error) {
          console.error('Ошибка обработки SDP:', error);
          this.notificationManager.notify('error', 'Ошибка установки соединения');
        }
      })
      // Обработка ICE кандидатов
      .on('iceCandidate', async ({ userId, candidate }) => {
        if (candidate) {
          await this.connectionManager.addIceCandidate(userId, candidate)
        }
      })

    // 2. События WebRTC соединений
    this.connectionManager
      .on('track', ({ userId, track, stream }) => {
        console.log('Получен трек в ConferenceService:', {
          userId,
          trackKind: track.kind,
          streamId: stream.id,
        })

        this.roomService.addStream(userId, stream)
        this.notifySubscribers()
      })
      .on('iceCandidate', ({ userId, candidate }) => {
        this.signalingService.sendIceCandidate(userId, candidate)
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

    // 3. События камеры
    this.mediaManager.on('stateChanged', async (state) => {
      this.notifySubscribers()

      // Оповещаем других участников об изменении состояния медиа
      if (state.stream) {
        const eventType = {
          audio: state.isAudioEnabled ? 'mic-on' : 'mic-off',
          video: state.isVideoEnabled ? 'camera-on' : 'camera-off',
        }

        this.signalingService.sendEvent({
          // @ts-ignore
          type: eventType.audio,
          payload: { streamId: state.stream.id },
        })

        this.signalingService.sendEvent({
          // @ts-ignore
          type: eventType.video,
          payload: { streamId: state.stream.id },
        })
      }
    })

    // 4. События трансляции экрана
    this.screenShareManager.on('stateChanged', async (state) => {
      this.notifySubscribers();

      if (state.stream && state.isActive) {
        // Отправляем событие
        this.signalingService.sendEvent({
          type: 'screen-share-on',
          payload: { streamId: state.stream.id },
        });

        // Получаем список других участников
        const participants = this.roomService.getParticipants()
          .filter(p => p.userId !== this.config.signaling.userId);

        // Добавляем треки в существующие соединения
        await Promise.all(
          participants.map(async (participant) => {
            for (const track of state.stream.getTracks()) {
              await this.connectionManager.addTrack(participant.userId, track, state.stream);
            }
          })
        );
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
      await this.mediaManager.toggleVideo();
      const { stream, isVideoEnabled } = this.mediaManager.getState();

      if (stream && isVideoEnabled) {
        // Получаем список других участников
        const participants = this.roomService.getParticipants()
          .filter(p => p.userId !== this.config.signaling.userId);

        // Добавляем видео трек во все существующие соединения
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          await Promise.all(
            participants.map(async (participant) => {
              await this.connectionManager.addTrack(participant.userId, videoTrack, stream);
            })
          );
        }
      }

      this.notifySubscribers();
    } catch (error) {
      console.error('Ошибка в toggleVideo:', error);
      this.notificationManager.notify('error', 'Ошибка управления камерой');
    }
  }

  // Включение/выключение микрофона
  async toggleAudio(): Promise<void> {
    this.#checkInitialized()
    await this.mediaManager.toggleAudio()
  }

  async startScreenShare(): Promise<void> {
    try {
      this.#checkInitialized()
      await this.screenShareManager.startScreenShare()

      // Обработка добавления треков происходит в обработчике событий screenShareManager
    } catch (error) {
      console.error('Ошибка запуска демонстрации экрана:', error)
      this.notificationManager.notify('error', 'Ошибка запуска демонстрации экрана')
    }
  }

  async stopScreenShare(): Promise<void> {
    try {
      this.#checkInitialized()
      const { stream } = this.screenShareManager.getState()

      if (stream) {
        // Удаляем треки демонстрации экрана из всех соединений
        const participants = this.roomService.getParticipants()
        await Promise.all(
          stream.getTracks().flatMap((track) => participants.map((p) => this.connectionManager.removeTrack(p.userId, track.id))),
        )
      }

      this.screenShareManager.stopScreenShare()
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

  async switchCamera(deviceId: string) {
    try {
      const oldTrack = this.mediaManager.getVideoTrack()
      const newTrack = await this.mediaManager.createVideoTrack(deviceId)

      if (oldTrack && newTrack) {
        // Заменяем трек во всех активных соединениях
        const participants = this.roomService.getParticipants()
        await Promise.all(
          participants.map((p) => this.connectionManager.replaceTrack(p.userId, oldTrack.id, newTrack)),
        )
      }
    } catch (error) {
      this.notificationManager.notify('error', 'Ошибка переключения камеры')
      throw error
    }
  }

  async switchMicrophone(deviceId: string) {
    try {
      const oldTrack = this.mediaManager.getAudioTrack()
      const newTrack = await this.mediaManager.createAudioTrack(deviceId)

      if (oldTrack && newTrack) {
        // Заменяем трек во всех активных соединениях
        const participants = this.roomService.getParticipants()
        await Promise.all(
          participants.map((p) => this.connectionManager.replaceTrack(p.userId, oldTrack.id, newTrack)),
        )
      }
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

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

// Конфигурация для сервисов
export interface ConferenceConfig {
  signaling: SignalingConfig
  room?: RoomInfo
  ice?: RTCIceServer[]
  mediaConstraints?: MediaStreamOptions
}

/**
 * ConferenceService как оркестратор:
 *
 * Знает как реагировать на события
 * Координирует работу всех сервисов
 * Содержит основную бизнес-логику
 * Принимает решения что делать при различных событиях
 */
export class ConferenceService {
  #initialized = false

  #subscribers: Array<(state: any) => void> = []

  #notificationManager: NotificationManager

  #roomService: RoomService

  #mediaManager: MediaStreamManager

  #screenShareManager: ScreenShareManager

  #signalingService: SignalingService

  #connectionService: ConnectionManager

  #reconnectTimeout?: NodeJS.Timeout

  constructor() {
    this.#notificationManager = new NotificationManager()
    this.#roomService = new RoomService()
    this.#mediaManager = new MediaStreamManager()
    this.#signalingService = new SignalingService()
    this.#screenShareManager = new ScreenShareManager()
    this.#connectionService = new ConnectionManager()
  }

  async initialize(config: ConferenceConfig) {
    try {
      if (this.#initialized) {
        await this.destroy()
      }

      // Инициализируем медиа сразу, так как он не зависит от комнаты
      this.#mediaManager.init(config.mediaConstraints)

      this.#connectionService.init({
        iceServers: config.ice,
        iceCandidatePoolSize: 10, // Улучшаем сбор ICE кандидатов
        iceTransportPolicy: 'all',
      })

      // Инициализируем соединение с сервером
      await this.#signalingService.init({
        url: config.signaling.url,
        userId: config.signaling.userId,
        dialogId: config.signaling.dialogId,
      })

      // Ждем подключения и информации о комнате
      const roomInfo = await this.#waitForRoomInfo()

      // Инициализируем сервис комнаты с полученными данными
      this.#roomService.initRoom(roomInfo)

      // Устанавливаем все обработчики событий
      this.#setupServiceInterconnections()

      this.#initialized = true
      this.#notifySubscribers()
    } catch (error) {
      this.#notificationManager.notify('error', 'Ошибка инициализации конференции')
      throw error
    }
  }

  subscribe(callback: (state: any) => void) {
    this.#subscribers.push(callback)
    callback(this.getState())

    // Возвращаем функцию для отписки
    return () => {
      this.#subscribers = this.#subscribers.filter((cb) => cb !== callback)
    }
  }

  #notifySubscribers() {
    const state = this.getState()
    this.#subscribers.forEach((callback) => callback(state))
  }

  // Вспомогательный метод для ожидания информации о комнате
  #waitForRoomInfo(): Promise<RoomInfo> {
    return new Promise((resolve, reject) => {
      // Таймаут на случай, если сервер не ответит
      const timeout = setTimeout(() => {
        reject(new Error('Room info timeout'))
      }, 10000) // 10 секунд на получение информации

      // Ожидаем подключение
      this.#signalingService.once('connected', () => {
        // После подключения ждем информацию о комнате
        this.#signalingService.once('roomInfo', (roomInfo: RoomInfo) => {
          clearTimeout(timeout)
          resolve(roomInfo)
        })
      })

      // Обработка ошибки подключения
      this.#signalingService.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }

  /**
   * Подписки на события всех сервисов
   */
  #setupServiceInterconnections() {
    // ===== Сигнальный сервер =====
    this.#signalingService.on('connected', () => {
      this.#notificationManager.notify('INFO', 'Подключился к конференции')
      if (this.#reconnectTimeout) {
        clearTimeout(this.#reconnectTimeout)
        this.#reconnectTimeout = undefined
      }
      this.#notifySubscribers()
    })

    this.#signalingService.on('disconnected', async () => {
      this.#notificationManager.notify('WARNING', 'Отключился от конференции')
      this.#notifySubscribers()
    })

    this.#signalingService.on('error', (error: Error) => {
      this.#notificationManager.notify('ERROR', error.message)
      this.#notifySubscribers()
    })

    this.#signalingService.on('userJoined', async (userId: string) => {
      try {
        this.#roomService.addParticipant(userId);
        this.#notificationManager.notify('INFO', `Пользователь ${userId} присоединился`);

        // 1. Создаем соединение
        const pc = await this.#connectionService.createConnection(userId);

        // 2. Добавляем медиа треки
        await this.#handleStreamUpdate(userId);

        // Проверяем, что треки действительно добавились
        const senders = pc.getSenders();
        console.log('Tracks added:', {
          senderCount: senders.length,
          trackTypes: senders.map(s => s.track?.kind)
        });

        // 3. Создаем и отправляем offer
        const offer = await this.#connectionService.createOffer(userId);
        this.#signalingService.sendOffer(userId, offer);

        this.#notificationManager.notify('INFO', `Отправлен offer пользователю ${userId}`);
        this.#notifySubscribers();
      } catch (error) {
        console.error('Ошибка присоединения пользователя:', error);
        this.#notificationManager.notify('ERROR', 'Ошибка подключения пользователя');
      }
    });

    this.#signalingService.on('userLeft', (userId: string) => {
      this.#roomService.removeParticipant(userId)
      this.#connectionService.closeConnection(userId)
      this.#notificationManager.notify('INFO', `Пользователь ${userId} покинул конференцию`)
      this.#notifySubscribers()
    })

    // ===== Медиа события =====
    const handleMediaChange = async () => {
      const connections = this.#connectionService.getAllConnections()
      await Promise.all(
        Array.from(connections).map(([userId]) => this.#handleStreamUpdate(userId)),
      )
      this.#notifySubscribers()
    }

    this.#mediaManager.on('streamStarted', handleMediaChange)
    this.#mediaManager.on('streamStopped', handleMediaChange)
    this.#mediaManager.on('videoToggled', handleMediaChange)
    this.#mediaManager.on('audioToggled', handleMediaChange)
    this.#screenShareManager.on('streamStarted', handleMediaChange)
    this.#screenShareManager.on('streamStopped', handleMediaChange)

    // ===== WebRTC события =====
    this.#connectionService.on('iceCandidate', ({ userId, candidate }) => {
      this.#signalingService.sendIceCandidate(userId, candidate)
    })

    this.#connectionService.on('iceConnectionStateChanged', async ({ userId, state }) => {
      if (state === 'failed') {
        this.#notificationManager.notify('WARNING', `Проблемы с подключением к ${userId}`)
        await this.#handleStreamUpdate(userId)
      }
    })

    this.#connectionService.on('track', ({ userId, track, streams, type }) => {
      if (track.kind === 'video') {
        this.#roomService.addRemoteStream(userId, streams[0], type)
        this.#notifySubscribers()
      }
    })

    // ===== SDP обмен =====
    this.#signalingService.on('sdp', async ({ userId, description }) => {
      try {
        console.log('___sdp_description', description)
        if (description.type === 'offer') {
          if (!this.#connectionService.getConnection(userId)) {
            await this.#connectionService.createConnection(userId)
          }
          await this.#handleStreamUpdate(userId)
          const answer = await this.#connectionService.handleOffer(userId, description)
          this.#signalingService.sendAnswer(userId, answer)
        } else if (description.type === 'answer') {
          await this.#connectionService.handleAnswer(userId, description)
        }
      } catch (error) {
        console.error('Error handling SDP:', error)
        this.#notificationManager.notify('ERROR', 'Ошибка обработки медиа данных')
      }
    })

    this.#signalingService.on('iceCandidate', async ({ userId, candidate }) => {
      try {
        console.log('userId', userId)
        console.log('candidate', candidate)
        await this.#connectionService.addIceCandidate(userId, candidate)
      } catch (error) {
        console.error('Ошибка добавления ICE candidate:', error)
      }
    })
  }

  async #handleStreamUpdate(userId: string) {
    const connection = this.#connectionService.getConnection(userId)
    if (!connection) return

    try {
      // Обновляем медиа потоки
      const { stream: cameraStream } = this.#mediaManager.getState()
      const { stream: screenStream } = this.#screenShareManager.getState()

      // Удаляем старые потоки
      if (cameraStream) {
        await this.#connectionService.removeStream(userId, cameraStream)
      }
      if (screenStream) {
        await this.#connectionService.removeStream(userId, screenStream)
      }

      // Добавляем новые потоки
      if (cameraStream) {
        await this.#connectionService.addStream(userId, cameraStream, 'camera')
      }
      if (screenStream) {
        await this.#connectionService.addStream(userId, screenStream, 'screen')
      }
    } catch (error) {
      console.error('Error updating streams:', error)
      this.#notificationManager.notify('ERROR', 'Ошибка обновления медиа потоков')
    }
  }

  // Обновляем публичные методы с проверкой инициализации
  async startLocalStream() {
    this.#checkInitialized()
    await this.#mediaManager.startStream()
  }

  stopLocalStream() {
    this.#checkInitialized()
    this.#mediaManager.stopStream()
  }

  toggleVideo() {
    this.#mediaManager.toggleVideo()
  }

  toggleAudio() {
    this.#mediaManager.toggleAudio()
  }

  async startScreenShare() {
    this.#checkInitialized()
    await this.#screenShareManager.startScreenShare()
  }

  async stopScreenShare() {
    this.#checkInitialized()
    await this.#screenShareManager.stopScreenShare()
  }

  // Получение текущего состояния
  getState() {
    return {
      initialized: this.#initialized,
      media: this.#mediaManager.getState(),
      signaling: this.#signalingService.getState(),
      participants: this.#roomService.getParticipants(),
      streams: this.#roomService.getStreams(),
      localScreenShare: this.#screenShareManager.getState(),
      connections: this.#connectionService.getAllConnections(),
    }
  }

  // Проверка инициализации перед выполнением операций
  #checkInitialized() {
    if (!this.#initialized) {
      throw new Error('ConferenceService не инициализирован')
    }
  }

  async destroy() {
    if (this.#initialized) {
      if (this.#reconnectTimeout) {
        clearTimeout(this.#reconnectTimeout)
      }

      await Promise.all([
        this.#mediaManager.destroy(),
        this.#screenShareManager.destroy(),
        this.#connectionService.destroy(),
        this.#signalingService.destroy(),
        this.#roomService.destroy(),
      ])

      this.#subscribers = []
      this.#initialized = false
      this.#notifySubscribers()
    }
  }
}

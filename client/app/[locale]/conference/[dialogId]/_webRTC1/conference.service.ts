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
      // Инициализируем медиа сразу, так как он не зависит от комнаты
      this.#mediaManager.init(config.mediaConstraints)

      this.#connectionService.init({ iceServers: config.ice })

      // Инициализируем соединение с сервером
      this.#signalingService.init({
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
    // ===== Подписка на события сигнального сервера =====
    this.#signalingService.on('connected', () => {
      this.#notificationManager.notify('INFO', 'Подключился к конференции')
      this.#notifySubscribers()
    })

    this.#signalingService.on('disconnected', () => {
      this.#notificationManager.notify('WARNING', 'Отключился от конференции')
      this.#notifySubscribers()
    })

    this.#signalingService.on('error', (error: Error) => {
      this.#notificationManager.notify('ERROR', error.message)
      this.#notifySubscribers()
    })

    this.#signalingService.on('userJoined', (userId: string) => {
      this.#roomService.addParticipant(userId)
      this.#notificationManager.notify('INFO', `Пользователь ${userId} присоединился к конференции`)
      this.#notifySubscribers()
    })

    this.#signalingService.on('userLeft', (userId: string) => {
      this.#roomService.removeParticipant(userId)
      this.#notificationManager.notify('INFO', `Пользователь ${userId} покинул конференцию`)
      this.#notifySubscribers()
    })

    // ===== Подписка на события медиа стрима (камеры) =====
    this.#mediaManager.on('streamStarted', () => {
      this.#notificationManager.notify('INFO', 'Началась трансляция с камеры')
      this.#notifySubscribers()
    })

    this.#mediaManager.on('streamStopped', () => {
      this.#notificationManager.notify('INFO', 'Остановилась трансляция с камеры')
      this.#notifySubscribers()
    })

    this.#mediaManager.on('videoToggled', (status: boolean) => {
      this.#notificationManager.notify('INFO', `Переключение видео камеры в режим: ${status}`)
      this.#notifySubscribers()
    })
    this.#mediaManager.on('audioToggled', (status: boolean) => {
      this.#notificationManager.notify('INFO', `Переключение аудио с камеры в режим: ${status}`)
      this.#notifySubscribers()
    })

    this.#mediaManager.on('error', (error: Error) => {
      this.#notificationManager.notify('ERROR', error.message)
      this.#notifySubscribers()
    })

    // ===== Подписка на события трансляции экрана =====
    this.#screenShareManager.on('streamStarted', () => {
      this.#notificationManager.notify('INFO', 'Началась трансляция экрана')
      this.#notifySubscribers()
    })

    this.#screenShareManager.on('streamStopped', () => {
      this.#notificationManager.notify('INFO', 'Остановилась трансляция экрана')
      this.#notifySubscribers()
    })

    // ===== Подписка на события сервиса подключений =====
    // ...
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
      media: this.#mediaManager.getState(),
      signaling: this.#signalingService.getState(),
      participants: this.#roomService.getParticipants(),
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

  destroy() {
    this.#subscribers = []
    this.#mediaManager.destroy()
    this.#roomService.destroy()
    this.#signalingService.destroy()
    this.#screenShareManager.destroy()
    this.#connectionService.destroy()
  }
}

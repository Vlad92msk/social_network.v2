import {
  ConnectionManager, MediaStreamManager, MediaStreamOptions, NotificationManager, RoomInfo, RoomService, ScreenShareManager, SettingsService, SignalingConfig, SignalingService,
} from './micro-services'

// Конфигурация для сервисов
interface ConferenceConfig {
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

  #signalingService: SignalingService

  constructor() {
    this.#notificationManager = new NotificationManager()
    this.#roomService = new RoomService()
    this.#mediaManager = new MediaStreamManager()
    this.#signalingService = new SignalingService()
  }

  async initialize(config: ConferenceConfig) {
    try {
      // Инициализируем медиа сразу, так как он не зависит от комнаты
      this.#mediaManager.init(config.mediaConstraints)

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
      this.#notificationManager.notify('error', 'Failed to initialize conference')
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
    console.log('state', state)
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

  #setupServiceInterconnections() {
    // Обработка событий сигнального сервера
    this.#signalingService.on('connected', () => {
      this.#notificationManager.notify('info', 'Connected to conference')
      this.#notifySubscribers()
    })

    this.#signalingService.on('disconnected', () => {
      this.#notificationManager.notify('warning', 'Disconnected from conference')
      this.#notifySubscribers()
    })

    this.#signalingService.on('error', (error: Error) => {
      this.#notificationManager.notify('error', error.message)
      this.#notifySubscribers()
    })

    this.#signalingService.on('userJoined', (userId: string) => {
      console.log('____userId', userId)
      this.#roomService.addParticipant(userId)
      this.#notificationManager.notify('info', `User ${userId} joined the conference`)
      this.#notifySubscribers()
    })

    this.#signalingService.on('userLeft', (userId: string) => {
      this.#roomService.removeParticipant(userId)
      this.#notificationManager.notify('info', `User ${userId} left the conference`)
      this.#notifySubscribers()
    })

    // Обработка событий медиа стрима
    this.#mediaManager.on('streamStarted', () => {
      this.#notificationManager.notify('info', 'Local media stream started')
      this.#notifySubscribers()
    })

    this.#mediaManager.on('error', (error: Error) => {
      this.#notificationManager.notify('error', error.message)
      this.#notifySubscribers()
    })
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
    return this.#mediaManager.toggleVideo()
  }

  toggleAudio() {
    return this.#mediaManager.toggleAudio()
  }

  // Получение текущего состояния
  getState() {
    return {
      media: this.#mediaManager.getState(),
      signaling: this.#signalingService.getState(),
      participants: this.#roomService.getParticipants(),
    }
  }

  // Проверка инициализации перед выполнением операций
  #checkInitialized() {
    if (!this.#initialized) {
      throw new Error('ConferenceService is not initialized')
    }
  }

  destroy() {
    this.#subscribers = []
    this.#mediaManager.destroy()
    this.#roomService.destroy()
    this.#signalingService.destroy()
  }
}

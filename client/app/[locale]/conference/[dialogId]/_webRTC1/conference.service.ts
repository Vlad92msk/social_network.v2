import {
  ConnectionManager, MediaStreamManager, MediaStreamOptions, NotificationManager, RoomInfo, RoomService, ScreenShareManager, SettingsService, SignalingConfig, SignalingService,
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

  constructor() {
    this.#notificationManager = new NotificationManager()
    this.#roomService = new RoomService()
    this.#mediaManager = new MediaStreamManager()
    this.#signalingService = new SignalingService()
    this.#screenShareManager = new ScreenShareManager()
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

  #setupServiceInterconnections() {
    // Обработка событий сигнального сервера
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

    // Обработка событий медиа стрима
    this.#mediaManager.on('streamStarted', () => {
      this.#notificationManager.notify('INFO', 'Local media stream started')
      this.#notifySubscribers()
    })

    this.#mediaManager.on('error', (error: Error) => {
      this.#notificationManager.notify('ERROR', error.message)
      this.#notifySubscribers()
    })

    // Подписываемся на события трансляции экрана
    this.#screenShareManager.on('streamStopped', () => {
      this.#notifySubscribers()
    })

    // Можно также подписаться на streamStarted если нужно
    this.#screenShareManager.on('streamStarted', () => {
      this.#notifySubscribers()
    })
  }

  // Обновляем публичные методы с проверкой инициализации
  async startLocalStream() {
    this.#checkInitialized()
    await this.#mediaManager.startStream()
    this.#notifySubscribers()
  }

  stopLocalStream() {
    this.#checkInitialized()
    this.#mediaManager.stopStream()
    this.#notifySubscribers()
  }

  toggleVideo() {
    this.#mediaManager.toggleVideo()
    this.#notifySubscribers()
  }

  toggleAudio() {
    this.#mediaManager.toggleAudio()
    this.#notifySubscribers()
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
  }
}

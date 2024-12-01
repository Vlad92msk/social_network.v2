'use client'

import { EventEmitter } from 'events'
import {
  ConnectionManager, EventType, MediaEvents,
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
  mediaConfig: MediaStreamOptions
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
      await this.connectionManager.init({
        iceServers: config.ice,
        iceTransportPolicy: 'all',
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 10,
      })

      // Инициализируем медиа менеджер с выключенными камерой и микрофоном
      await this.mediaManager.init({
        ...config.mediaConfig,
        video: false,
        audio: false,
        autoPlay: true,
        muted: true,
      })

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
          if (description.type === 'offer') {
            if (!this.connectionManager.hasConnection(userId)) {
              await this.connectionManager.createConnection(userId)
            }
            // Обрабатываем offer и отправляем answer
            const answer = await this.connectionManager.handleOffer(userId, description)
            await this.signalingService.sendAnswer(userId, answer)
          } else if (description.type === 'answer') {
            await this.connectionManager.handleAnswer(userId, description)
          }
        } catch (error) {
          console.error('Ошибка обработки SDP:', error)
          this.notificationManager.notify('error', 'Ошибка установки соединения')
        }
      })
      // Обработка ICE кандидатов
      .on('iceCandidate', async ({ userId, candidate }) => {
        if (candidate) {
          await this.connectionManager.addIceCandidate(userId, candidate)
        }
      })
      .on('userEvent', (payload: EventType) => {
        const { event, initiator } = payload
        console.clear()

        switch (event.type) {
          case 'mic-off':
            this.roomService.updateParticipantMedia(initiator, { isAudioEnabled: false })
            break
          case 'mic-on':
            this.roomService.updateParticipantMedia(initiator, { isAudioEnabled: true })
            break
          case 'camera-off':
            this.roomService.updateParticipantMedia(initiator, { isVideoEnabled: false })
            break
          case 'camera-on':
            this.roomService.updateParticipantMedia(initiator, { isVideoEnabled: true })
            break
          case 'screen-share-off':
            this.roomService.updateParticipantMedia(initiator, { isScreenSharing: false })
            break
          case 'screen-share-on':
            this.roomService.updateParticipantMedia(initiator, { isScreenSharing: true })
            break
          default: break
        }
        this.notifySubscribers()
      })

    // 2. События WebRTC соединений
    this.connectionManager
      .on('track', ({ userId, track }) => {
        // console.clear()
        // console.log(`Получен трек от ${userId}, track: ${track}`, stream)
        this.roomService.handleTrack(userId, track)

        track.addEventListener('ended', () => {
          this.roomService.handleTrackEnded(userId, track)
        })
      })
      .on('iceCandidate', async ({ userId, candidate }) => {
        await this.signalingService.sendIceCandidate(userId, candidate)
      })
      .on('negotiationNeeded', async ({ userId, offer }) => {
        try {
          if (offer) {
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
      .on('iceState', ({ userId, state }: { userId: string, state: any }) => {
        console.log(`ICE state: ${state}`)

        // @ts-ignore
        if (state === 'connected' || state === 'completed') {
          console.log(`Соединение с пользователем: ${userId} успешно установлено`)
        }
      })

    // 3. События камеры
    this.mediaManager
      .on(MediaEvents.TRACK_ADDED, async ({ kind, track, stream }: { kind: 'video' | 'audio', track: MediaStreamTrack, stream: MediaStream }) => {
        this.notifySubscribers()

        console.log(`[Media] Новый ${kind} трек добавлен:`, {
          trackId: track.id,
          streamId: stream.id,
          enabled: track.enabled,
        })

        // Получаем активные соединения
        const activeConnections = this.connectionManager.getConnections()

        await Promise.all(activeConnections.map(async ({ userId }) => {
          try {
            const connection = this.connectionManager.getConnection(userId)
            if (!connection) return

            // Проверяем существующие отправители для данного типа трека
            const existingSender = connection.getSenders().find((s) => s.track?.kind === kind)

            if (existingSender) {
            // Если отправитель существует - заменяем трек
              console.log(`[Media] Заменяем существующий ${kind} трек для пользователя ${userId}`)
              await existingSender.replaceTrack(track)
            } else {
            // Если отправителя нет - добавляем новый трек
              console.log(`[Media] Добавляем новый ${kind} трек для пользователя ${userId}`)
              await this.connectionManager.addTrack(userId, track, stream)
            }
          } catch (error) {
            console.error(`[Media] Ошибка обработки трека для пользователя ${userId}:`, error)
          }
        }))
      })
      .on(MediaEvents.TRACK_REMOVED, async ({ kind, trackId }: { kind: 'video' | 'audio', trackId: string }) => {
        const activeConnections = this.connectionManager.getConnections()

        await Promise.all(activeConnections.map(async ({ userId }) => {
          try {
            await this.connectionManager.removeTrack(userId, trackId)
          } catch (error) {
            console.error(`[Media] Ошибка удаления трека для пользователя ${userId}:`, error)
          }
        }))
      })
      .on(MediaEvents.TRACK_MUTED, ({ kind }: { kind: 'video' | 'audio', track: MediaStreamTrack }) => {
        const type = kind === 'video' ? 'camera' : 'mic'
        this.signalingService.sendEvent({ type: `${type}-off` })
      })
      .on(MediaEvents.TRACK_UNMUTED, ({ kind }: { kind: 'video' | 'audio', track: MediaStreamTrack}) => {
        const type = kind === 'video' ? 'camera' : 'mic'
        this.signalingService.sendEvent({ type: `${type}-on` })
      })
      .on('stateChanged', (s) => {
        this.notifySubscribers()
      })

    this.roomService.on('stateChanged', (state: ReturnType<RoomService['getState']>) => {
      const media = state.participants.find(({ userId }) => userId === '6')?.media
      // console.clear()
      console.log('___MEDIA____', media)
      this.notifySubscribers()
    })
  }

  private async handleUserJoined(user: UserInfo): Promise<void> {
    try {
      this.roomService.addParticipant(user)
      const userId = String(user.id)

      const hasActiveConnection = this.connectionManager.hasConnection(userId)
      // Когда пользователь переподключается - удаляем прошлое соединение
      if (hasActiveConnection) {
        // Закрываем старое соединение
        this.connectionManager.closeConnection(userId)
      }
      // Создаём peer соединение
      await this.connectionManager.createConnection(userId)

      // Добавляем текущие треки в соединение
      const mediaStream = this.mediaManager.getStream()
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          this.connectionManager.addTrack(userId, track, mediaStream)
        })
      }

      // Создаем и отправляем offer
      const offer = await this.connectionManager.createOffer(userId)
      if (offer) {
        await this.signalingService.sendOffer(userId, offer)
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

  // Управление видео
  async toggleLocalVideo(): Promise<void> {
    const track = this.mediaManager.getVideoTrack()
    const { isVideoMuted, isVideoEnabled } = this.mediaManager.getState()

    if (!track) {
      await this.mediaManager.enableVideo()
    } else if (isVideoEnabled && !isVideoMuted) {
      this.mediaManager.muteVideo()
    } else {
      this.mediaManager.unmuteVideo()
    }
  }

  // Управление аудио
  async toggleLocalAudio(): Promise<void> {
    const track = this.mediaManager.getAudioTrack()
    const { isAudioEnabled, isAudioMuted } = this.mediaManager.getState()

    if (!track) {
      await this.mediaManager.enableAudio()
    } else if (isAudioEnabled && !isAudioMuted) {
      this.mediaManager.muteAudio()
    } else {
      this.mediaManager.unmuteAudio()
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

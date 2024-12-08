'use client'

import { EventEmitter } from 'events'
import {
  ConnectionManager, EventType, MediaEvents,
  MediaStreamManager,
  MediaStreamOptions,
  NotificationManager, Participant,
  RoomInfo,
  RoomService,
  ScreenShareManager,
  SignalingConfig,
  SignalingService,
} from './micro-services'
import { UserInfo } from '../../../../../../swagger/userInfo/interfaces-userInfo'

// Определяем типы всех возможных событий
export type ConferenceEventMap = {
  // Пользователи
  'userJoined': { user: UserInfo }
  'userLeft': { userId: string, leavedUser?: Participant }
  'userRaiseHand': { userId: string }
  'userLowerHand': { userId: string }
  // Медиа события
  'userMutedAudio': { userId: string }
  'userUnmutedAudio': { userId: string }
  'userEnabledVideo': { userId: string }
  'userDisabledVideo': { userId: string }
  // События демонстрации экрана
  'userStartedScreenShare': { user?: Participant, streamId: string }
  'userStoppedScreenShare': { userId: string }
  // События чата
  'chatMessage': { userId: string, message: string }
  // События состояния
  'connectionStateChanged': { userId: string, state: RTCPeerConnectionState }
  'roomStateChanged': { state: RoomInfo }
}

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
  private config: ConferenceConfig

  private subscribers: Array<(state: any) => void> = []

  private initialized = false

  constructor(
    private readonly notificationManager: NotificationManager = new NotificationManager(),
    private readonly roomService: RoomService = new RoomService(),
    private readonly mediaManager: MediaStreamManager = new MediaStreamManager(),
    private readonly screenShareManager: ScreenShareManager = new ScreenShareManager(),
    private readonly signalingService: SignalingService = new SignalingService(),
    private readonly connectionManager: ConnectionManager = new ConnectionManager(),
  ) {
    super()
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
      // this.emit('initialized')
    } catch (error) {
      this.notificationManager.notify('error', 'Ошибка инициализации конференции')
      throw error
    }
  }

  // Типизированные методы для работы с событиями
  on<K extends keyof ConferenceEventMap>(event: K, listener: (payload: ConferenceEventMap[K]) => void): this {
    return super.on(event, listener)
  }

  emit<K extends keyof ConferenceEventMap>(event: K, payload: ConferenceEventMap[K]): boolean {
    return super.emit(event, payload)
  }

  #setupEvents() {
    // 1. События сигнального сервера
    this.signalingService
      // Обработка подключения нового участника
      .on('userJoined', async (user: UserInfo) => {
        await this.handleUserJoined(user)
        this.emit('userJoined', { user })
      })
      // Обработка отключения участника
      .on('userLeft', (userId) => {
        this.connectionManager.closeConnection(userId)
        const leavedUser = this.roomService.getParticipant(userId)
        this.roomService.removeParticipant(userId)
        this.emit('userLeft', { userId, leavedUser })
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

        switch (event.type) {
          case 'initial-setup':
            this.roomService.handleInitialSetup(initiator, event.payload)
            break
          case 'mic-off':
            this.roomService.handleAudioState(initiator, false)
            break
          case 'mic-on':
            this.roomService.handleAudioState(initiator, true)
            break
          case 'camera-off':
            this.roomService.handleVideoState(initiator, false)
            break
          case 'camera-on':
            this.roomService.handleVideoState(initiator, true)
            break
          case 'camera-start':
            this.roomService.handleCameraStart(initiator, event.payload.cameraStreamId)
            break
          case 'screen-share-off':
            this.roomService.handleScreenShare(initiator, false)
            this.emit('userStoppedScreenShare', { userId: initiator })
            break
          case 'screen-share-on':
            this.roomService.handleScreenShare(initiator, true, event.payload.screenStreamId)
            const user = this.roomService.getParticipant(initiator)
            this.emit('userStartedScreenShare', { user, streamId: event.payload.screenStreamId })
            break
          default: break
        }
      })

    // 2. События WebRTC соединений
    this.connectionManager
      .on('track', ({ userId, track, stream }) => {
        console.log(`Получен трек от ${userId}, stream: ${stream.id}, track: ${track.id}`)
        this.roomService.handleTrack(userId, track, stream)

        track.addEventListener('ended', () => {
          this.roomService.handleTrackEnded(userId, track, stream)
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
        // this.notifySubscribers()

        // Отправляем camera-start только для видео трека
        if (kind === 'video') {
          this.signalingService.sendEvent({
            type: 'camera-start',
            payload: { cameraStreamId: stream.id },
          })
        }
        // Получаем активные соединения
        const activeConnections = this.connectionManager.getConnections()

        await Promise.all(activeConnections.map(async ({ userId }) => {
          try {
            const connection = this.connectionManager.getConnection(userId)
            if (!connection) return

            // Проверяем существующие отправители для данного типа трека
            const existingSender = connection.getSenders().find((s) => s.track?.kind === kind)

            if (existingSender) {
              await existingSender.replaceTrack(track)
            } else {
              await this.connectionManager.addTrack(userId, track, stream)
            }
          } catch (error) {
            console.error(`[Media] Ошибка обработки трека для пользователя ${userId}:`, error)
          }
        }))
      })
      .on(MediaEvents.TRACK_REMOVED, async ({ kind, trackId }: { kind: 'video' | 'audio', trackId: string }) => {
        // this.notifySubscribers()
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
        // this.notifySubscribers()
        const type = kind === 'video' ? 'camera' : 'mic'
        this.signalingService.sendEvent({ type: `${type}-off` })
      })
      .on(MediaEvents.TRACK_UNMUTED, ({ kind }: { kind: 'video' | 'audio', track: MediaStreamTrack}) => {
        // this.notifySubscribers()
        const type = kind === 'video' ? 'camera' : 'mic'
        this.signalingService.sendEvent({ type: `${type}-on` })
      })
      .on('stateChanged', (s) => {
        this.notifySubscribers()
      })

    // 4. События трансляции экрана
    this.screenShareManager
      .on('streamStarted', async (stream: MediaStream) => {
        this.notifySubscribers()

        // Отправляем сигнал о начале трансляции
        this.signalingService.sendEvent({
          type: 'screen-share-on',
          payload: {
            screenStreamId: stream.id,
            trackId: stream.getVideoTracks()[0]?.id, // Добавляем ID трека
          },
        })

        // Получаем активные соединения и добавляем трек
        const activeConnections = this.connectionManager.getConnections()
        await Promise.all(activeConnections.map(async ({ userId }) => {
          try {
            const connection = this.connectionManager.getConnection(userId)
            if (!connection) return

            const track = stream.getVideoTracks()[0]
            await this.connectionManager.addTrack(userId, track, stream)
          } catch (error) {
            console.error(`[ScreenShare] Ошибка добавления трека трансляции для ${userId}:`, error)
          }
        }))
      })
      .on('streamStopped', async ({ streamId }) => {
        this.notifySubscribers()

        // Отправляем сигнал об окончании трансляции
        this.signalingService.sendEvent({
          type: 'screen-share-off',
          payload: { screenStreamId: streamId },
        })

        const activeConnections = this.connectionManager.getConnections()
        await Promise.all(activeConnections.map(async ({ userId }) => {
          try {
            const connection = this.connectionManager.getConnection(userId)
            if (!connection) return

            const screenSender = connection.getSenders()
              .find((sender) => sender.track?.id === streamId)

            if (screenSender) {
              await this.connectionManager.removeTrack(userId, screenSender.track!.id)
            }
          } catch (error) {
            console.error(`[ScreenShare] Ошибка удаления трека трансляции для ${userId}:`, error)
          }
        }))
      })

    this.roomService.on('stateChanged', (state: ReturnType<ConferenceService['getState']>['roomInfo']) => {
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
      const { stream: mediaStream, isAudioEnabled: cameraIsAudioEnabled, isVideoEnabled: cameraIsVideoEnabled, isAudioMuted } = this.mediaManager.getState()
      const { stream: screenStream, isVideoEnabled: screenIsVideoEnabled } = this.screenShareManager.getState()

      // Отправляем initial-setup только с действительно необходимыми полями
      const initialSetup = {
        isAudioEnabled: cameraIsAudioEnabled && !isAudioMuted,
        isVideoEnabled: cameraIsVideoEnabled,
        isScreenSharing: screenIsVideoEnabled,
        ...(mediaStream?.id && { cameraStreamId: mediaStream.id }),
        ...(screenStream?.id && screenIsVideoEnabled && { screenStreamId: screenStream.id }),
      }

      this.signalingService.sendEvent({
        type: 'initial-setup',
        payload: initialSetup,
      })

      // Добавляем треки с камеры
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          this.connectionManager.addTrack(userId, track, mediaStream)
        })
      }

      // Добавляем треки с экрана, если трансляция активна
      if (screenStream && screenIsVideoEnabled) {
        screenStream.getTracks().forEach((track) => {
          this.connectionManager.addTrack(userId, track, screenStream)
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

  async toggleLocalVideo(): Promise<void> {
    const { isVideoEnabled, isVideoMuted } = this.mediaManager.getState()

    if (!isVideoEnabled) {
      await this.mediaManager.enableVideo()
    } else if (!isVideoMuted) {
      this.mediaManager.muteVideo()
    } else {
      this.mediaManager.unmuteVideo()
    }
  }

  async toggleLocalAudio(): Promise<void> {
    const { isAudioEnabled, isAudioMuted } = this.mediaManager.getState()

    if (!isAudioEnabled) {
      await this.mediaManager.enableAudio()
    } else if (!isAudioMuted) {
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
      this.screenShareManager.stopScreenShare()
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

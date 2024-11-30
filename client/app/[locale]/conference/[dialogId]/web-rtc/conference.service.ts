'use client'

import { EventEmitter } from 'events'
import {
  ConnectionManager, EventType,
  MediaStreamManager,
  MediaStreamOptions, MediaStreamState,
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
        console.log('___СОБЫТИЕ____', payload)
        const { type, initiator, payload: s } = payload
        switch (type) {
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
      .on('track', ({ userId, track, stream }) => {
        this.roomService.handleTrack(userId, track)

        // Слушаем завершение трека
        track.onended = () => {
          this.roomService.handleTrackEnded(userId, track)
        }
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
    this.mediaManager.on('stateChanged', async (mediaState: MediaStreamState) => {
      // Уведомляем подписчиков об изменении состояния
      this.notifySubscribers()

      // Отправляем события в сигнальный сервер об изменении состояния
      this.signalingService.sendEvent({
        type: mediaState.hasAudio && !mediaState.isAudioMuted ? 'mic-on' : 'mic-off',
      })

      this.signalingService.sendEvent({
        type: mediaState.hasVideo && !mediaState.isVideoMuted ? 'camera-on' : 'camera-off',
      })

      // Если появился новый стрим (первое включение камеры или микрофона)
      if (mediaState.stream) {
        const participants = this.roomService
          .getParticipants()
          .filter((p) => p.userId !== this.config.signaling.userId)

        // Добавляем треки в существующие соединения
        participants.forEach((participant) => {
          const connection = this.connectionManager.getConnection(participant.userId)
          if (!connection) return

          // Получаем текущие отправители
          const senders = connection.getSenders()

          // Для видео
          if (mediaState.hasVideo && !senders.some((s) => s.track?.kind === 'video')) {
            const videoTrack = mediaState.stream!.getVideoTracks()[0]
            this.connectionManager.addTrack(participant.userId, videoTrack, mediaState.stream!)
          }

          // Для аудио
          if (mediaState.hasAudio && !senders.some((s) => s.track?.kind === 'audio')) {
            const audioTrack = mediaState.stream!.getAudioTracks()[0]
            this.connectionManager.addTrack(participant.userId, audioTrack, mediaState.stream!)
          }
        })
      }
    })

    this.roomService.on('stateChanged', (state: ReturnType<RoomService['getState']>) => {
      const media = state.participants.find(({ userId }) => userId === '6')?.media
      // console.clear()
      console.log('___MEDIA____', media)
      console.log('___GETTRACKS____', media?.stream?.getTracks())
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

  // Управление видео
  async toggleVideo(): Promise<void> {
    try {
      this.#checkInitialized()
      const state = this.mediaManager.getState()

      if (!state.hasVideo) {
        // Если нет видео трека, включаем видео
        await this.mediaManager.enableVideo()
      } else {
        // Если есть - просто переключаем mute состояние
        if (state.isVideoMuted) {
          await this.mediaManager.unmuteVideo()
        } else {
          await this.mediaManager.muteVideo()
        }
      }
    } catch (error) {
      console.error('Ошибка в toggleVideo:', error)
      this.notificationManager.notify('error', 'Ошибка управления камерой')
    }
  }

  // Управление аудио
  async toggleAudio(): Promise<void> {
    try {
      this.#checkInitialized()
      const state = this.mediaManager.getState()

      if (!state.hasAudio) {
        // Если нет аудио трека, включаем аудио
        await this.mediaManager.enableAudio()
      } else {
        // Если есть - просто переключаем mute состояние
        if (state.isAudioMuted) {
          await this.mediaManager.unmuteAudio()
        } else {
          await this.mediaManager.muteAudio()
        }
      }
    } catch (error) {
      console.error('Ошибка в toggleAudio:', error)
      this.notificationManager.notify('error', 'Ошибка управления микрофоном')
    }
  }

  // Полное отключение видео
  async stopVideo(): Promise<void> {
    try {
      this.#checkInitialized()
      const state = this.mediaManager.getState()

      if (state.hasVideo) {
        // Удаляем видео треки из всех соединений
        const participants = this.roomService.getParticipants()
        const videoTrack = this.mediaManager.getVideoTrack()

        if (videoTrack) {
          await Promise.all(
            participants.map((p) => this.connectionManager.removeTrack(p.userId, videoTrack.id)),
          )
        }

        // Отключаем видео в медиа менеджере
        this.mediaManager.disableVideo()
      }
    } catch (error) {
      this.notificationManager.notify('error', 'Ошибка отключения видео')
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

import { DefaultEventsMap } from '@socket.io/component-emitter'
import { Socket } from 'socket.io-client'
import { ConnectionService } from './micro-services/connection.service'
import { ScreenSharingService } from './micro-services/screen-share.service'
import { SignalingService } from './micro-services/signaling.service'
import { WebRTCStore } from './micro-services/store.service'
import { WebRTCEventsName, WebRTCState, WebRTCStateChangeType } from './types'
import { SendSignalType } from '../_store/conferenceSocketMiddleware'

// Типы для сигнальных событий
interface SignalEvents {
  offer: { userId: string; signal: RTCSessionDescriptionInit };
  answer: { userId: string; signal: RTCSessionDescriptionInit };
  'ice-candidate': { userId: string; signal: RTCIceCandidateInit };
}

export class WebRTCManager {
  private static instance: WebRTCManager

  private store: WebRTCStore | null = null

  private connectionService: ConnectionService | null = null

  private signalingService: SignalingService | null = null

  private screenSharingService: ScreenSharingService | null = null

  private signalHandlers: (() => void)[] = []

  private initialized = false

  // Приватный конструктор для паттерна Singleton
  private constructor() {}

  static getInstance(): WebRTCManager {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager()
    }
    return WebRTCManager.instance
  }

  init(
    config: {
      currentUserId: string;
      dialogId?: string;
      iceServers?: RTCIceServer[];
    },
    sendSignal: SendSignalType,
  ) {
    if (this.initialized) {
      this.destroy()
    }

    this.store = new WebRTCStore(config)
    this.connectionService = new ConnectionService(this.store)
    this.screenSharingService = new ScreenSharingService(this.store, this.connectionService, sendSignal)
    this.signalingService = new SignalingService(this.store, this.connectionService, sendSignal, this.screenSharingService)
    this.initialized = true
  }

  private assertInitialized() {
    if (!this.initialized || !this.store || !this.connectionService || !this.signalingService) {
      throw new Error('WebRTCManager not initialized. Call init() first.')
    }
  }

  getState(): WebRTCState {
    this.assertInitialized()
    return this.store!.getState()
  }

  setLocalStream(stream?: MediaStream) {
    this.assertInitialized()
    this.store!.setState(WebRTCStateChangeType.STREAM, { localStream: stream })
  }

  connectSignaling(socket: Socket<DefaultEventsMap, DefaultEventsMap> | null) {
    this.assertInitialized()
    if (!socket) return

    const handleOffer = ({ userId, signal }: SignalEvents['offer']) => {
      this.store!.emit(WebRTCEventsName.SIGNAL_RECEIVED, {
        senderId: userId,
        signal: { type: 'offer', payload: signal },
      })
    }

    const handleAnswer = ({ userId, signal }: SignalEvents['answer']) => {
      this.store!.emit(WebRTCEventsName.SIGNAL_RECEIVED, {
        senderId: userId,
        signal: { type: 'answer', payload: signal },
      })
    }

    const handleIceCandidate = ({ userId, signal }: SignalEvents['ice-candidate']) => {
      this.store!.emit(WebRTCEventsName.SIGNAL_RECEIVED, {
        senderId: userId,
        signal: { type: 'ice-candidate', payload: signal },
      })
    }

    // Добавляем обработчики для screen sharing сигналов
    const handleScreenSharingStarted = ({ userId }: { userId: string }) => {
      this.store!.emit(WebRTCEventsName.SIGNAL_RECEIVED, {
        senderId: userId,
        signal: { type: 'screen-sharing-started', payload: { userId } },
      })
    }

    const handleScreenSharingStopped = ({ userId }: { userId: string }) => {
      this.store!.emit(WebRTCEventsName.SIGNAL_RECEIVED, {
        senderId: userId,
        signal: { type: 'screen-sharing-stopped', payload: { userId } },
      })
    }

    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)
    socket.on('screen-sharing-started', handleScreenSharingStarted)
    socket.on('screen-sharing-stopped', handleScreenSharingStopped)

    this.signalHandlers = [
      () => socket.off('offer', handleOffer),
      () => socket.off('answer', handleAnswer),
      () => socket.off('ice-candidate', handleIceCandidate),
      () => socket.off('screen-sharing-started', handleScreenSharingStarted),
      () => socket.off('screen-sharing-stopped', handleScreenSharingStopped),
    ]

    return () => {
      this.signalHandlers.forEach((cleanup) => cleanup())
      this.signalHandlers = []
    }
  }

  updateParticipants(participants: string[]) {
    this.assertInitialized()
    this.signalingService!.updateParticipants(participants)
  }

  async refreshConnection(targetUserId: string) {
    this.assertInitialized()
    await this.signalingService!.refreshConnection(targetUserId)
  }

  subscribe(listener: (state: WebRTCState) => void) {
    this.assertInitialized()
    const unsubscribe = this.store!.on(WebRTCEventsName.STATE_CHANGED, () => {
      listener(this.store!.getState())
    })
    // Сразу вызываем listener с текущим состоянием
    listener(this.store!.getState())
    return unsubscribe
  }

  // Добавляем методы для управления screen sharing
  startScreenSharing(): Promise<MediaStream | undefined> {
    this.assertInitialized()
    return this.screenSharingService!.startScreenSharing()
  }

  stopScreenSharing() {
    this.assertInitialized()
    this.screenSharingService!.stopScreenSharing()
  }

  destroy() {
    if (!this.initialized) return
    if (this.initialized) {
      const streams = this.store?.getDomainState(WebRTCStateChangeType.STREAM).streams || {}
      Object.keys(streams).forEach((userId) => {
        this.connectionService?.closeConnection(userId)
      })
      this.screenSharingService?.cleanup()
      this.store = null
      this.connectionService = null
      this.signalingService = null
      this.screenSharingService = null
      this.initialized = false
    }
  }
}

export const webRTCManager = WebRTCManager.getInstance()

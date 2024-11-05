import { DefaultEventsMap } from '@socket.io/component-emitter'
import { Socket } from 'socket.io-client'
import { ConnectionService } from './micro-services/connection.service'
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
  private store: WebRTCStore

  private connectionService: ConnectionService

  private signalingService: SignalingService

  private signalHandlers: (() => void)[] = []

  constructor(
    config: {
      currentUserId: string;
      dialogId?: string;
      iceServers?: RTCIceServer[];
    },
    sendSignal: SendSignalType,
  ) {
    this.store = new WebRTCStore(config)
    this.connectionService = new ConnectionService(this.store)
    this.signalingService = new SignalingService(this.store, this.connectionService, sendSignal)
  }

  getState(): WebRTCState {
    return this.store.getState()
  }

  setLocalStream(stream?: MediaStream) {
    this.store.setState(
      WebRTCStateChangeType.STREAM,
      { localStream: stream },
    )
  }

  setDialogId(dialogId: string) {
    this.store.setState(
      WebRTCStateChangeType.DIALOG,
      { dialogId },
    )
  }

  // Слушаем сокет события
  connectSignaling(socket: Socket<DefaultEventsMap, DefaultEventsMap> | null) {
    if (!socket) return

    const handleOffer = ({ userId, signal }: SignalEvents['offer']) => {
      this.store.emit(WebRTCEventsName.SIGNAL_RECEIVED, {
        senderId: userId,
        signal: { type: 'offer', payload: signal },
      })
    }

    const handleAnswer = ({ userId, signal }: SignalEvents['answer']) => {
      this.store.emit(WebRTCEventsName.SIGNAL_RECEIVED, {
        senderId: userId,
        signal: { type: 'answer', payload: signal },
      })
    }

    const handleIceCandidate = ({ userId, signal }: SignalEvents['ice-candidate']) => {
      this.store.emit(WebRTCEventsName.SIGNAL_RECEIVED, {
        senderId: userId,
        signal: { type: 'ice-candidate', payload: signal },
      })
    }

    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)

    this.signalHandlers = [
      () => socket.off('offer', handleOffer),
      () => socket.off('answer', handleAnswer),
      () => socket.off('ice-candidate', handleIceCandidate),
    ]

    return () => {
      this.signalHandlers.forEach((cleanup) => cleanup())
      this.signalHandlers = []
    }
  }

  updateParticipants(participants: string[]) {
    this.signalingService.updateParticipants(participants)
  }

  refreshConnection(targetUserId: string) {
    this.signalingService.refreshConnection(targetUserId)
  }

  subscribe(listener: (state: WebRTCState) => void) {
    const unsubscribe = this.store.on(WebRTCEventsName.STATE_CHANGED, () => {
      listener(this.store.getState())
    })
    // Сразу вызываем listener с текущим состоянием
    listener(this.store.getState())
    return unsubscribe
  }

  destroy() {
    // Закрываем все соединения
    const { streams } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
    Object.keys(streams).forEach((userId) => {
      this.connectionService.closeConnection(userId)
    })
  }
}

import { ConnectionService } from './micro-services/connection.service'
import { SignalingService } from './micro-services/signaling.service'
import { WebRTCStore } from './micro-services/store.service'
import { WebRTCState } from './types'
import { SendSignalType } from '../_store/conferenceSocketMiddleware'

export class WebRTCManager {
  private store: WebRTCStore

  private connectionService: ConnectionService

  private signalingService: SignalingService

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
    this.store.setState({ localStream: stream })
  }

  setDialogId(dialogId: string) {
    this.store.setState({ dialogId })
  }

  handleSignal(senderId: string, signal: any) {
    this.store.emit('signal:received', { senderId, signal })
  }

  updateParticipants(participants: string[]) {
    this.signalingService.updateParticipants(participants)
  }

  refreshConnection(targetUserId: string) {
    this.signalingService.refreshConnection(targetUserId)
  }

  subscribe(listener: (state: WebRTCState) => void) {
    const unsubscribe = this.store.on('state:changed', () => {
      listener(this.store.getState())
    })
    // Сразу вызываем listener с текущим состоянием
    listener(this.store.getState())
    return unsubscribe
  }

  destroy() {
    // Закрываем все соединения
    const state = this.store.getState()
    Object.keys(state.streams).forEach((userId) => {
      this.connectionService.closeConnection(userId)
    })
  }
}

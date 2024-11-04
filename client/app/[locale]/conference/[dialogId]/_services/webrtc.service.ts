import { BaseWebRTCService } from './micro-services/base.service'
import { PeerConnectionManager } from './micro-services/peer-connection.service'
import { SignalingHandler } from './micro-services/signaling-handler.service'
import { WebRTCConfig, WebRTCState } from './types'
import { SendSignalType } from '../_store/conferenceSocketMiddleware'

export class WebRTCManager extends BaseWebRTCService {
  private state: WebRTCState = {
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  }

  private listeners = new Set<(state: WebRTCState) => void>()

  private signalingHandler: SignalingHandler

  private peerManager: PeerConnectionManager

  constructor(config: WebRTCConfig, sendSignal: SendSignalType) {
    super(config, sendSignal)
    this.peerManager = new PeerConnectionManager(config, sendSignal)
    this.signalingHandler = new SignalingHandler(config, sendSignal)
    this.setupSignalingHandlers()
  }

  private setupSignalingHandlers() {
    this.signalingHandler.setHandlers({
      onOffer: async (senderId, payload) => {
        const pc = this.setupPeerConnection(senderId)
        await pc.setRemoteDescription(payload)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        this.signalingHandler.sendAnswer(senderId, answer)
      },
      onAnswer: async (senderId, payload) => {
        const pc = this.peerManager.getConnection(senderId)
        if (pc) await pc.setRemoteDescription(payload)
      },
      onIceCandidate: async (senderId, payload) => {
        const pc = this.peerManager.getConnection(senderId)
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(payload)
        }
      },
    })
  }

  private setState(newState: Partial<WebRTCState>) {
    this.state = { ...this.state, ...newState }
    this.listeners.forEach((listener) => listener(this.state))
  }

  private setupPeerConnection(targetUserId: string) {
    return this.peerManager.createConnection(
      targetUserId,
      // Обработчик обновления стрима
      (userId, stream) => {
        this.setState({
          streams: {
            ...this.state.streams,
            [userId]: stream,
          },
        })
      },
      // Обработчик изменения состояния
      (userId, connectionState) => {
        this.setState({
          connectionStatus: {
            ...this.state.connectionStatus,
            [userId]: connectionState,
          },
        })

        if (['failed', 'disconnected', 'closed'].includes(connectionState)) {
          setTimeout(() => {
            if (this.localStream) {
              console.log(`Попытка переподключиться с пользователем ID ${userId}`)
              this.initiateConnection(userId)
            }
          }, 1000)
        }
      },
      // Передаем обработчик ICE кандидатов
      (candidate) => this.signalingHandler.sendIceCandidate(targetUserId, candidate),
    )
  }

  override setLocalStream(stream?: MediaStream) {
    // Сначала вызываем базовый метод, который вызовет onLocalStreamChanged
    super.setLocalStream(stream)

    // Также напрямую устанавливаем стрим в peerManager
    this.peerManager.setLocalStream(stream)
  }

  override setDialogId(dialogId: string) {
    super.setDialogId(dialogId)
    this.peerManager.setDialogId(dialogId)
    this.signalingHandler.setDialogId(dialogId)
  }

  private async initiateConnection(targetUserId: string) {
    const localStream = this.getLocalStream() // Используем getter
    if (!localStream) return

    try {
      this.setState({ isConnecting: true })
      const pc = this.setupPeerConnection(targetUserId)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      const dialogId = this.getDialogId() // Используем getter
      if (dialogId) {
        this.signalingHandler.sendOffer(targetUserId, offer)
      }
    } catch (e) {
      console.warn('Non-critical error in initiateConnection:', e)
    } finally {
      this.setState({ isConnecting: false })
    }
  }

  // Теперь handleSignal просто делегирует обработку в SignalingHandler
  async handleSignal(senderId: string, signal: any) {
    await this.signalingHandler.handleSignal(senderId, signal)
  }

  updateParticipants(participants: string[]) {
    const dialogId = this.getDialogId()
    if (!this.localStream || !dialogId) return

    participants.forEach((participantId) => {
      if (participantId !== this.getCurrentUserId()) {
        const pc = this.peerManager.getConnection(participantId)
        if (!pc || !['connected', 'connecting'].includes(pc.connectionState)) {
          this.initiateConnection(participantId)
        }
      }
    })

    // Отключаем ушедших участников
    Object.keys(this.state.streams).forEach((participantId) => {
      if (!participants.includes(participantId)) {
        console.log(`Участник с ID ${participantId} вышел`)
        this.peerManager.closeConnection(participantId)

        const { [participantId]: _, ...newStreams } = this.state.streams
        const { [participantId]: __, ...newStatus } = this.state.connectionStatus

        this.setState({
          streams: newStreams,
          connectionStatus: newStatus,
        })
      }
    })
  }

  async refreshConnection(targetUserId: string) {
    console.log(`Принудительное переподключение с пользователем с ID ${targetUserId}`)

    this.peerManager.closeConnection(targetUserId)
    this.setState({
      streams: {
        ...this.state.streams,
        [targetUserId]: undefined,
      },
      connectionStatus: {
        ...this.state.connectionStatus,
        [targetUserId]: 'disconnected',
      },
    })

    if (this.localStream && this.getDialogId()) {
      await this.initiateConnection(targetUserId)
    }
  }

  subscribe(listener: (state: WebRTCState) => void) {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  destroy() {
    this.peerManager.destroy()
    this.setState({
      streams: {},
      isConnecting: false,
      connectionStatus: {},
    })
    this.listeners.clear()
  }

  getState() {
    return this.state
  }
}

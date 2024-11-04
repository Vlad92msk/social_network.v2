import { BaseWebRTCService } from './micro-services/base.service'
import { PeerConnectionManager } from './micro-services/peer-connection.service'
import { SignalParams, WebRTCConfig, WebRTCState } from './types'

export class WebRTCManager extends BaseWebRTCService {
  private state: WebRTCState = {
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  }

  private listeners = new Set<(state: WebRTCState) => void>()

  private peerManager: PeerConnectionManager

  constructor(config: WebRTCConfig, sendSignal: (params: SignalParams) => void) {
    super(config, sendSignal)
    this.peerManager = new PeerConnectionManager(config, sendSignal)
  }

  override setLocalStream(stream?: MediaStream) {
    super.setLocalStream(stream)
    this.peerManager.setLocalStream(stream)
  }

  override setDialogId(dialogId: string) {
    super.setDialogId(dialogId)
    this.peerManager.setDialogId(dialogId)
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

        // Обработка разрыва соединения и переподключение
        if (['failed', 'disconnected', 'closed'].includes(connectionState)) {
          setTimeout(() => {
            if (this.localStream) {
              console.log(`Попытка переподключиться с пользователем ID ${userId}`)
              this.initiateConnection(userId)
            }
          }, 1000)
        }
      },
    )
  }

  async initiateConnection(targetUserId: string) {
    if (!this.localStream) return

    try {
      this.setState({ isConnecting: true })
      const pc = this.setupPeerConnection(targetUserId)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const dialogId = this.getDialogId()
      if (dialogId) {
        this.sendSignal({
          targetUserId,
          signal: { type: 'offer', payload: offer },
          dialogId,
        })
      }
    } catch (e) {
      console.warn('Non-critical error in initiateConnection:', e)
    } finally {
      this.setState({ isConnecting: false })
    }
  }

  async handleSignal(senderId: string, signal: any) {
    const dialogId = this.getDialogId()
    if (!dialogId) return

    try {
      switch (signal.type) {
        case 'offer': {
          const pc = this.setupPeerConnection(senderId)
          await pc.setRemoteDescription(signal.payload)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          this.sendSignal({
            targetUserId: senderId,
            signal: { type: 'answer', payload: answer },
            dialogId,
          })
          break
        }
        case 'answer': {
          const pc = this.peerManager.getConnection(senderId)
          if (pc) await pc.setRemoteDescription(signal.payload)
          break
        }
        case 'ice-candidate': {
          const pc = this.peerManager.getConnection(senderId)
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(signal.payload)
          }
          break
        }
        default: {
          console.warn('Неизвестный тип сигнала:', signal.type)
          break
        }
      }
    } catch (e) {
      console.warn('Non-critical error handling signal:', e)
    }
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

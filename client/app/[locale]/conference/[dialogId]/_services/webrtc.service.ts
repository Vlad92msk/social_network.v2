// Интерфейс состояния WebRTC соединений
import { merge } from 'lodash'
import { PeerConnectionConfig, PeerConnectionManager } from './micro-services/peer-connection.service'

export interface WebRTCState {
  // Хранит MediaStream для каждого пользователя (ключ - ID пользователя)
  streams: Record<string, MediaStream | undefined>;
  // Флаг, указывающий что идет процесс установки соединения
  isConnecting: boolean;
  // Статус соединения для каждого пользователя
  connectionStatus: Record<string, RTCPeerConnectionState>;
}

// Тип для функции-слушателя изменений состояния
export type WebRTCStateListener = (state: WebRTCState) => void;

export interface WebRTCConfig {
  currentUserId: string;
  dialogId?: string;
}
export interface SignalParams {
  targetUserId: string;
  signal: any;
  dialogId: string;
}

export class WebRTCManager {
  private mainConfig: WebRTCConfig

  private peerConnectionManagerConfig: PeerConnectionConfig

  private state: WebRTCState = {
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  }

  private listeners = new Set<WebRTCStateListener>()

  private localStream?: MediaStream

  private peerManager: PeerConnectionManager

  constructor(
    config: WebRTCConfig,
    private sendSignal: (params: SignalParams) => void,
  ) {
    this.mainConfig = config
    this.peerConnectionManagerConfig = {
      dialogId: config.dialogId,
      currentUserId: config.currentUserId,
    }

    this.peerManager = new PeerConnectionManager(
      this.peerConnectionManagerConfig,
      sendSignal,
    )
  }

  private setState(newState: Partial<WebRTCState>) {
    this.state = merge({}, this.state, newState)
    this.listeners.forEach((listener) => listener(this.state))
  }

  setLocalStream(stream?: MediaStream) {
    this.localStream = stream
    this.peerManager.setLocalStream(stream)
  }

  setDialogId(dialogId: string) {
    this.mainConfig.dialogId = dialogId
    this.peerConnectionManagerConfig.dialogId = dialogId
    this.peerManager.setDialogId(dialogId)
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

      const dialogId = this.peerManager.getDialogId()
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
    const dialogId = this.peerManager.getDialogId()
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
    const dialogId = this.peerManager.getDialogId()
    if (!this.localStream || !dialogId) return

    participants.forEach((participantId) => {
      if (participantId !== this.peerManager.getCurrentUserId()) {
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

        const newStreams = { ...this.state.streams }
        delete newStreams[participantId]

        const newStatus = { ...this.state.connectionStatus }
        delete newStatus[participantId]

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

    if (this.localStream && this.mainConfig.dialogId) {
      await this.initiateConnection(targetUserId)
    }
  }

  subscribe(listener: WebRTCStateListener) {
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

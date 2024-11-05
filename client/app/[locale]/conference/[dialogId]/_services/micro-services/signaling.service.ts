import { ConnectionService } from './connection.service'
import { WebRTCStore } from './store.service'
import { SendSignalType } from '../../_store/conferenceSocketMiddleware'
import { WebRTCEventsName, WebRTCStateChangeType } from '../types'

export class SignalingService {
  constructor(
    private store: WebRTCStore,
    private connectionService: ConnectionService,
    private sendSignal: SendSignalType,
  ) {
    // Подписываемся на входящие сигналы
    this.store.on(WebRTCEventsName.SIGNAL_RECEIVED, async ({ senderId, signal }) => {
      await this.handleSignal(senderId, signal)
    })

    // Подписываемся на создание новых соединений для настройки ICE кандидатов
    this.store.on(WebRTCEventsName.CONNECTION_CREATED, ({ userId, connection }) => {
      this.setupIceCandidateHandling(userId, connection)
    })
  }

  private setupIceCandidateHandling(userId: string, connection: RTCPeerConnection) {
    connection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        const state = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
        const { dialogId } = state

        if (dialogId) {
          this.sendSignal({
            targetUserId: userId,
            signal: {
              type: 'ice-candidate',
              payload: candidate,
            },
            dialogId,
          })
        }
      }
    }
  }

  private async handleSignal(senderId: string, signal: any) {
    const state = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    if (!state.dialogId) return

    try {
      switch (signal.type) {
        case 'offer': {
          const pc = this.connectionService.createConnection(senderId)
          await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          this.sendSignal({
            targetUserId: senderId,
            signal: {
              type: 'answer',
              payload: answer,
            },
            dialogId: state.dialogId,
          })
          break
        }

        case 'answer': {
          const pc = this.connectionService.getConnection(senderId)
          if (pc) {
            await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
          }
          break
        }

        case 'ice-candidate': {
          const pc = this.connectionService.getConnection(senderId)
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(signal.payload as RTCIceCandidateInit)
          }
          break
        }

        default: {
          console.warn('Неизвестный тип сигнала:', signal.type)
          break
        }
      }
    } catch (e) {
      console.warn('Error handling signal:', e)
    }
  }

  // Методы для отправки сигналов
  async sendOffer(targetUserId: string, connection: RTCPeerConnection) {
    const state = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    if (!state.dialogId) return

    try {
      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)

      this.sendSignal({
        targetUserId,
        signal: {
          type: 'offer',
          payload: offer,
        },
        dialogId: state.dialogId,
      })
    } catch (e) {
      console.warn('Error sending offer:', e)
    }
  }

  // Вспомогательный метод для инициации соединения
  async initiateConnection(targetUserId: string) {
    const { dialogId } = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    const { localStream } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
    if (!localStream || !dialogId) return

    try {
      this.store.setState(WebRTCStateChangeType.CONNECTION, { isConnecting: true })
      const connection = this.connectionService.createConnection(targetUserId)
      await this.sendOffer(targetUserId, connection)
    } catch (e) {
      console.warn('Error initiating connection:', e)
    } finally {
      this.store.setState(WebRTCStateChangeType.CONNECTION, { isConnecting: false })
    }
  }

  // Метод для обновления участников
  updateParticipants(participants: string[]) {
    const { dialogId, currentUserId } = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    const { localStream, streams } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
    if (!localStream || !dialogId) return

    // Инициируем соединения с новыми участниками
    participants.forEach((participantId) => {
      if (participantId !== currentUserId) {
        const connection = this.connectionService.getConnection(participantId)
        if (!connection || !['connected', 'connecting'].includes(connection.connectionState)) {
          this.initiateConnection(participantId)
        }
      }
    })

    // Отключаем ушедших участников
    const currentParticipants = Object.keys(streams)
    currentParticipants.forEach((participantId) => {
      if (!participants.includes(participantId)) {
        console.log(`Участник с ID ${participantId} вышел`)
        this.connectionService.closeConnection(participantId)
      }
    })
  }

  // Метод для принудительного переподключения
  async refreshConnection(targetUserId: string) {
    const { dialogId } = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    const { localStream } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
    console.log(`Принудительное переподключение с пользователем с ID ${targetUserId}`)

    this.connectionService.closeConnection(targetUserId)

    if (localStream && dialogId) {
      await this.initiateConnection(targetUserId)
    }
  }
}

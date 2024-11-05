// Менеджер peer-соединений
import { WebRTCStore } from './store.service'
import { WebRTCEventsName, WebRTCStateChangeType } from '../types'

export class ConnectionService {
  private connections: Record<string, RTCPeerConnection> = {}

  constructor(private store: WebRTCStore) {
    this.store.on(WebRTCEventsName.STATE_CHANGED, (event) => {
      if (event.type === WebRTCStateChangeType.STREAM) {
        console.log('___event', event)
      }
      switch (event.type) {
        case WebRTCStateChangeType.STREAM:
          if ('localStream' in event.payload) {
            this.updateLocalStream(event.payload.localStream)
          }
          break

        case WebRTCStateChangeType.DIALOG:
          if ('dialogId' in event.payload) {
          }
          break

        case WebRTCStateChangeType.CONNECTION:
          // Обработка изменений состояния соединения
          break

        case WebRTCStateChangeType.SIGNAL:
          // Обработка сигнальных изменений
          break

        default:
          // Добавляем default case для ESLint
          break
      }
    })
  }

  createConnection(targetUserId: string) {
    const { localStream, streams } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
    const { iceServers } = this.store.getDomainState(WebRTCStateChangeType.SIGNAL)
    const { connectionStatus } = this.store.getDomainState(WebRTCStateChangeType.CONNECTION)

    const pc = new RTCPeerConnection({ iceServers })

    pc.onconnectionstatechange = () => {
      this.store.setState(
        WebRTCStateChangeType.CONNECTION,
        {
          connectionStatus: {
            ...connectionStatus,
            [targetUserId]: pc.connectionState,
          },
        },
      )
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
      })
    }

    pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        this.store.setState(WebRTCStateChangeType.STREAM, {
          streams: {
            ...streams,
            [targetUserId]: event.streams[0],
          },
        })
      }
    }

    this.connections[targetUserId] = pc
    this.store.emit(WebRTCEventsName.CONNECTION_CREATED, { userId: targetUserId, connection: pc })
    return pc
  }

  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.connections[userId]
  }

  closeConnection(userId: string) {
    const connection = this.connections[userId]
    if (connection) {
      connection.close()
      delete this.connections[userId]

      const { connectionStatus } = this.store.getDomainState(WebRTCStateChangeType.CONNECTION)
      const { streams } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
      const newStreams = { ...streams }
      const newStatus = { ...connectionStatus }
      delete newStreams[userId]
      delete newStatus[userId]

      this.store.setState(WebRTCStateChangeType.CONNECTION, { connectionStatus: newStatus })
      this.store.setState(WebRTCStateChangeType.STREAM, { streams: newStreams })
    }
  }

  private updateLocalStream(stream?: MediaStream) {
    Object.entries(this.connections).forEach(([_, connection]) => {
      connection.getSenders().forEach((sender) => {
        const track = stream?.getTracks().find((t) => t.kind === sender.track?.kind)
        if (track) sender.replaceTrack(track)
      })
    })
  }
}

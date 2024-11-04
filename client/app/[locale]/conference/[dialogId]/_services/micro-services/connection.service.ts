// Менеджер peer-соединений
import { WebRTCStore } from './store.service'
import { WebRTCEventsName, WebRTCState } from '../types'

type WebRTCStateChange = {
  type: 'connection';
  payload: Partial<WebRTCState>;
}

function isStateChange(change: any): change is WebRTCStateChange {
  return change.type === 'connection' && 'payload' in change
}

export class ConnectionService {
  private connections: Record<string, RTCPeerConnection> = {}

  constructor(private store: WebRTCStore) {
    this.store.on(WebRTCEventsName.STATE_CHANGED, (changes) => {
      if (isStateChange(changes) && 'localStream' in changes.payload) {
        this.updateLocalStream(changes.payload.localStream)
      }
    })
  }

  createConnection(targetUserId: string) {
    const state = this.store.getState()

    const pc = new RTCPeerConnection({
      iceServers: state.iceServers,
    })

    pc.onconnectionstatechange = () => {
      this.store.setState({
        connectionStatus: {
          ...this.store.getState().connectionStatus,
          [targetUserId]: pc.connectionState,
        },
      })
    }

    const { localStream } = state
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
      })
    }

    pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        this.store.setState({
          streams: {
            ...this.store.getState().streams,
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

      // Обновляем состояние
      const { streams, connectionStatus } = this.store.getState()
      const newStreams = { ...streams }
      const newStatus = { ...connectionStatus }
      delete newStreams[userId]
      delete newStatus[userId]

      this.store.setState({
        streams: newStreams,
        connectionStatus: newStatus,
      })
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

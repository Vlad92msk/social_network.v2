// Сервис WebRTC подключений
import { EventEmitter } from 'events'

export class ConnectionManager extends EventEmitter {
  private peerConnections: Map<string, RTCPeerConnection> = new Map()

  constructor() {
    super()
  }

  async createConnection(userId: string): Promise<RTCPeerConnection> {
    const connection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('iceCandidate', { userId, candidate: event.candidate })
      }
    }

    connection.ontrack = (event) => {
      this.emit('track', { userId, track: event.track, streams: event.streams })
    }

    this.peerConnections.set(userId, connection)
    return connection
  }

  async addStream(userId: string, stream: MediaStream) {
    const connection = this.peerConnections.get(userId)
    if (connection) {
      stream.getTracks().forEach((track) => {
        connection.addTrack(track, stream)
      })
    }
  }

  closeConnection(userId: string) {
    const connection = this.peerConnections.get(userId)
    if (connection) {
      connection.close()
      this.peerConnections.delete(userId)
      this.emit('connectionClosed', userId)
    }
  }
}

import { ConnectionStatus, Peer, WebRTCConfig } from './types'

export class PeerConnectionManager {
  private peers: Map<string, Peer> = new Map()

  private config: WebRTCConfig

  constructor(config: WebRTCConfig) {
    this.config = config
  }

  /**
   * Создание нового WebRTC соединения с удаленным пиром
   */
  createConnection(peerId: string): RTCPeerConnection {
    if (this.peers.has(peerId)) {
      throw new Error(`Peer connection already exists: ${peerId}`)
    }

    const connection = new RTCPeerConnection({
      ...this.config,
      // @ts-ignore
      sdpSemantics: 'unified-plan',
    })

    this.peers.set(peerId, {
      connection,
      streams: { video: null, screen: null, audio: null },
      status: 'connecting',
    })

    return connection
  }

  getConnection(peerId: string) {
    return this.peers.get(peerId)?.connection
  }

  updatePeerStatus(peerId: string, status: ConnectionStatus) {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.status = status
      return true
    }
    return false
  }

  removePeer(peerId: string) {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.connection.close()
      this.peers.delete(peerId)
    }
  }

  getPeers() {
    return Array.from(this.peers.entries())
  }
}

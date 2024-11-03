import { MediaStreamManager } from './MediaStreamManager'
import { PeerConnectionManager } from './PeerConnectionManager'

export class SignalingHandler {
  constructor(
    private peerManager: PeerConnectionManager,
    private mediaManager: MediaStreamManager,
  ) {}

  async handleOffer(senderId: string, offer: RTCSessionDescriptionInit) {
    let connection = this.peerManager.getConnection(senderId)

    if (!connection) {
      connection = this.peerManager.createConnection(senderId)
    }

    await connection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await connection.createAnswer()
    await connection.setLocalDescription(answer)

    return answer
  }

  async handleAnswer(senderId: string, answer: RTCSessionDescriptionInit) {
    const connection = this.peerManager.getConnection(senderId)
    if (connection) {
      await connection.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  async handleIceCandidate(senderId: string, candidate: RTCIceCandidateInit) {
    const connection = this.peerManager.getConnection(senderId)
    if (connection && connection.remoteDescription) {
      await connection.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }
}

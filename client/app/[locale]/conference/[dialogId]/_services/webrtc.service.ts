// services/webrtc.service.ts

export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map()

  // Конфигурация WebRTC
  private config: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  }

  // Создание нового peer connection
  async createPeerConnection(
    targetUserId: string,
    stream: MediaStream | undefined,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onTrack: (stream: MediaStream) => void,
  ): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection(this.config)

    // Добавляем локальные треки
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })
    }

    // Обработка ICE кандидатов
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate)
      }
    }

    // Обработка входящего стрима
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        onTrack(event.streams[0])
      }
    }

    this.peerConnections.set(targetUserId, pc)
    console.log('peerConnections____', this.peerConnections)
    return pc
  }

  // Создание offer
  async createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    return offer
  }

  // Создание answer
  async createAnswer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return answer
  }

  // Получение peer connection по ID пользователя
  getPeerConnection(userId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(userId)
  }

  // Закрытие соединения
  closePeerConnection(userId: string): void {
    const pc = this.peerConnections.get(userId)
    if (pc) {
      pc.close()
      this.peerConnections.delete(userId)
    }
  }

  // Закрытие всех соединений
  closeAllConnections(): void {
    this.peerConnections.forEach((pc) => pc.close())
    this.peerConnections.clear()
  }
}

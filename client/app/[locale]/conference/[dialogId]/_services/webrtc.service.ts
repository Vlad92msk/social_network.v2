// services/webrtc.service.ts

export class WebRTCService {
  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  }

  async createPeerConnection(
    targetUserId: string,
    stream: MediaStream | undefined,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onTrack: (stream: MediaStream) => void,
  ): Promise<RTCPeerConnection> {
    console.log('Creating peer connection:', { targetUserId, hasStream: !!stream })
    const pc = new RTCPeerConnection(this.config)

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', pc.iceConnectionState)
    }

    pc.onconnectionstatechange = () => {
      console.log('Connection state changed:', pc.connectionState)
    }

    pc.onsignalingstatechange = () => {
      console.log('Signaling state changed:', pc.signalingState)
    }

    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log('Adding track to peer connection:', track.kind)
        pc.addTrack(track, stream)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate.type)
        onIceCandidate(event.candidate)
      }
    }

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        console.log('Received remote track:', event.track.kind)
        onTrack(event.streams[0])
      }
    }

    return pc
  }

  async createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    const offer = await pc.createOffer()
    console.log('Created offer:', { type: offer.type })
    await pc.setLocalDescription(offer)
    return offer
  }

  async createAnswer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    const answer = await pc.createAnswer()
    console.log('Created answer:', { type: answer.type })
    await pc.setLocalDescription(answer)
    return answer
  }

  async setRemoteDescription(pc: RTCPeerConnection, description: RTCSessionDescriptionInit) {
    await pc.setRemoteDescription(new RTCSessionDescription(description))
    console.log('Remote description set:', { type: description.type })
  }
}

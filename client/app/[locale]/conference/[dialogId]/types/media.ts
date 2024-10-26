export interface MediaStreamState {
  stream: MediaStream | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
}

export interface PeerConnection {
  id: string
  connection: RTCPeerConnection
  stream?: MediaStream
}

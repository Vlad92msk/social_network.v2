export type MediaType = 'video' | 'screen' | 'audio';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  debug?: boolean;
}

export interface Peer {
  connection: RTCPeerConnection;
  streams: Record<MediaType, MediaStream | null>;
  status: ConnectionStatus;
}

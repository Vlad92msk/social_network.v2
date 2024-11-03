import { ConnectionStatus, MediaType, Peer } from '../types'

export interface IMediaStreamManager {
  setStream(type: MediaType, stream: MediaStream | null): Promise<MediaStream | null>;
  getStream(type: MediaType): Promise<MediaStream | null>;
  startScreenShare(): Promise<MediaStream>;
  startVideoStream(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  stopStream(type: MediaType): void;
  getActiveStreams(): Record<MediaType, MediaStream>;
}

export interface IPeerConnectionManager {
  createConnection(peerId: string): RTCPeerConnection;
  getConnection(peerId: string): RTCPeerConnection | undefined;
  updatePeerStatus(peerId: string, status: ConnectionStatus): boolean;
  removePeer(peerId: string): void;
  getPeers(): [string, Peer][];
}

export interface ISignalingHandler {
  handleOffer(senderId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  handleAnswer(senderId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  handleIceCandidate(senderId: string, candidate: RTCIceCandidateInit): Promise<void>;
}

export interface IWebRTCService {
  connect(peerId: string): Promise<void>;
  disconnect(peerId: string): Promise<void>;
  startStream(type: MediaType): Promise<MediaStream>;
  stopStream(type: MediaType): void;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}

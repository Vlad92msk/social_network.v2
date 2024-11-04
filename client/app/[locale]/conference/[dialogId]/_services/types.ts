export interface WebRTCConfig {
  currentUserId: string;
  dialogId?: string;
  iceServers?: RTCIceServer[];
}

// Интерфейс состояния WebRTC соединений
export interface WebRTCState {
  // Хранит MediaStream для каждого пользователя (ключ - ID пользователя)
  streams: Record<string, MediaStream | undefined>;
  // Флаг, указывающий что идет процесс установки соединения
  isConnecting: boolean;
  // Статус соединения для каждого пользователя
  connectionStatus: Record<string, RTCPeerConnectionState>;
}

export interface PeerConnectionState {
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

// Интерфейс состояния WebRTC соединений
export interface WebRTCState {
  currentUserId: string;
  dialogId?: string;
  iceServers: RTCIceServer[];
  localStream?: MediaStream;
  // Хранит MediaStream для каждого пользователя (ключ - ID пользователя)
  streams: Record<string, MediaStream | undefined>;
  // Флаг, указывающий что идет процесс установки соединения
  isConnecting: boolean;
  // Статус соединения для каждого пользователя
  connectionStatus: Record<string, RTCPeerConnectionState>;
}

export enum WebRTCEventsName {
  STATE_CHANGED = 'state:changed',
  CONNECTION_CREATED = 'connection:created',
  SIGNAL_RECEIVED = 'signal:received',
}

export interface WebRTCEvents {
  [WebRTCEventsName.STATE_CHANGED]: {
    type: 'connection' | 'signal';
    payload: Partial<WebRTCState> | { userId: string; connection: RTCPeerConnection };
  };
  [WebRTCEventsName.CONNECTION_CREATED]: { userId: string; connection: RTCPeerConnection };
  [WebRTCEventsName.SIGNAL_RECEIVED]: { senderId: string; signal: any };
}

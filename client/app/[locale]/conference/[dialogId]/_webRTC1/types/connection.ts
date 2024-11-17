// ======= ConnectionManager ======
//
type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

// Типы событий
interface ConnectionStateEvent {
  userId: string;
  state: ConnectionState;
}

interface TrackEvent {
  userId: string;
  track: MediaStreamTrack;
  stream: MediaStream;
}

interface TrackEndedEvent {
  userId: string;
  trackId: string;
}

interface ErrorEvent {
  userId: string;
  error: Error;
}

interface IceCandidateEvent {
  userId: string;
  candidate: RTCIceCandidate;
}

// События, которые может эмитить менеджер
interface ConnectionManagerEvents {
  connectionState: (event: ConnectionStateEvent) => void;
  track: (event: TrackEvent) => void;
  trackEnded: (event: TrackEndedEvent) => void;
  error: (event: ErrorEvent) => void;
  iceCandidate: (event: IceCandidateEvent) => void;
  negotiationNeeded: (event: { userId: string }) => void;
}

// Основной интерфейс менеджера соединений
interface ConnectionManager {
  // Инициализация
  init(config: RTCConfiguration): Promise<void>;

  // Управление соединениями
  createConnection(userId: string): Promise<void>;
  getConnection(userId: string): RTCPeerConnection | undefined;
  isConnected(userId: string): boolean;
  close(userId: string): void;
  destroy(): void;

  // Управление WebRTC процессом установки соединения
  createOffer(userId: string): Promise<RTCSessionDescriptionInit | undefined>;
  handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(userId: string, candidate: RTCIceCandidate): Promise<void>;

  // Управление медиа треками
  addTrack(userId: string, track: MediaStreamTrack, stream: MediaStream): Promise<void>;
  removeTrack(userId: string, trackId: string): Promise<void>;

  // События (наследуются от EventEmitter)
  on<E extends keyof ConnectionManagerEvents>(
    event: E,
    listener: ConnectionManagerEvents[E]
  ): this;

  emit<E extends keyof ConnectionManagerEvents>(
    event: E,
    args: Parameters<ConnectionManagerEvents[E]>[0]
  ): boolean;
}

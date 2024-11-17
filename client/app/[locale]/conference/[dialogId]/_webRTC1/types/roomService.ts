// ======= RoomService ======
//
interface RoomInfo {
  dialogId: string;
  participants: string[];
  createdAt: string;
}

interface Participant {
  userId: string;
  streams: Set<MediaStream>;
}

// События сервиса
interface RoomEvents {
  initialized: (info: RoomInfo) => void;
  participantAdded: (data: { userId: string }) => void;
  participantRemoved: (data: { userId: string }) => void;
  streamAdded: (data: { userId: string; stream: MediaStream }) => void;
  streamRemoved: (data: { userId: string; streamId: string }) => void;
  participantAudioMuted: (data: { userId: string }) => void;
  participantAudioUnmuted: (data: { userId: string }) => void;
}

// Интерфейс сервиса
interface RoomService {
  // Управление комнатой
  init(info: RoomInfo): void;
  destroy(): void;
  getRoomInfo(): RoomInfo | undefined;

  // Управление участниками
  addParticipant(userId: string): void;
  removeParticipant(userId: string): void;
  getParticipant(userId: string): Participant | undefined;
  getParticipants(): Participant[];
  getParticipantCount(): number;
  hasParticipant(userId: string): boolean;

  // Управление медиа
  addStream(userId: string, stream: MediaStream): void;
  removeStream(userId: string, streamId: string): void;
  getStreams(): Array<{ userId: string; streams: MediaStream[] }>;
  getParticipantTracks(userId: string, kind?: 'audio' | 'video'): MediaStreamTrack[];

  // Управление аудио
  muteParticipantAudio(userId: string): void;
  unmuteParticipantAudio(userId: string): void;

  // События (наследуется от EventEmitter)
  on<K extends keyof RoomEvents>(event: K, listener: RoomEvents[K]): this;
  emit<K extends keyof RoomEvents>(event: K, ...args: Parameters<RoomEvents[K]>): boolean;
  removeAllListeners(): void;
}

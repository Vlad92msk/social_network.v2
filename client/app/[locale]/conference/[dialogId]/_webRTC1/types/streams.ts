// Общие типы для медиа событий
export interface MediaToggleEvent {
  active: boolean;
  streamId: string;
}

export interface StreamStoppedEvent {
  streamId: string;
}

// Интерфейсы для MediaStreamManager
export interface MediaStreamOptions {
  audio?: boolean;
  video?: boolean;
  videoConstraints?: MediaTrackConstraints;
  audioConstraints?: MediaTrackConstraints;
}

export interface MediaStreamState {
  stream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  error: Error | null;
}

export interface IMediaStreamManager {
  // Методы управления
  init(options?: MediaStreamOptions): void;
  startStream(): Promise<void>;
  stopStream(): void;
  toggleVideo(): Promise<void>;
  toggleAudio(): void;
  getState(): MediaStreamState;
  destroy(): void;

  // События
  on(event: 'initialized', listener: (state: MediaStreamState) => void): this;
  on(event: 'streamStarted', listener: (stream: MediaStream) => void): this;
  on(event: 'streamStopped', listener: (event: StreamStoppedEvent) => void): this;
  on(event: 'videoToggled', listener: (event: MediaToggleEvent) => void): this;
  on(event: 'audioToggled', listener: (event: MediaToggleEvent) => void): this;
  on(event: 'stateChanged', listener: (state: MediaStreamState) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'destroyed', listener: () => void): this;
}

// Интерфейсы для ScreenShareManager
export interface ScreenShareState {
  stream?: MediaStream;
  isVideoEnabled: boolean;
}

export interface IScreenShareManager {
  // Методы управления
  startScreenShare(): Promise<void>;
  stopScreenShare(): void;
  isScreenSharing(): boolean;
  getState(): ScreenShareState;
  destroy(): void;

  // События
  on(event: 'streamStarted', listener: (stream: MediaStream) => void): this;
  on(event: 'streamStopped', listener: (event: StreamStoppedEvent) => void): this;
}

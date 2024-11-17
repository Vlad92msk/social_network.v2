// ======= SignalingService ======
//

// Базовые типы сигнальных сообщений
export type SignalType = 'offer' | 'answer' | 'ice-candidate';

// Типы событий участников
export type ParticipantEventType =
  | 'mic-on'
  | 'mic-off'
  | 'camera-on'
  | 'camera-off'
  | 'screen-share-on'
  | 'screen-share-off';

// Интерфейс события участника
export interface ParticipantEvent {
  type: ParticipantEventType;
  initiator: string;
  payload?: any;
}

// Конфигурация сигнального сервиса
export interface SignalingConfig {
  userId: string;
  dialogId: string;
  url: string;
}

// Состояние сигнального сервиса
export interface SignalingState {
  isConnected: boolean;
  error: Error | null;
  config: SignalingConfig | null;
}

// Формат сигнального сообщения
export interface SignalMessage {
  type: SignalType;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

// События WebRTC
export interface WebRTCSignalEvent {
  userId: string;
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

// Интерфейс сигнального сервиса
export interface ISignalingService {
  // Инициализация
  init(config: SignalingConfig): Promise<void>;

  // Отправка сигналов WebRTC
  sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit): void;
  sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit): void;
  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit): void;

  // Отправка событий участника
  sendEvent(event: { type: ParticipantEventType; payload?: any }): void;

  // Управление состоянием
  getState(): SignalingState;
  destroy(): void;

  // События, которые можно слушать
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'stateChanged', listener: (state: SignalingState) => void): this;
  on(event: 'userJoined', listener: (userId: string) => void): this;
  on(event: 'userLeft', listener: (userId: string) => void): this;
  on(event: 'participantsUpdated', listener: (participants: string[]) => void): this;
  on(event: 'roomInfo', listener: (roomInfo: any) => void): this;
  on(event: 'userEvent', listener: (event: ParticipantEvent) => void): this;
  on(event: 'sdp', listener: (event: WebRTCSignalEvent) => void): this;
  on(event: 'iceCandidate', listener: (event: WebRTCSignalEvent) => void): this;
}

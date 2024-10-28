// Все возможные типы сигналов в WebRTC коммуникации
export type SignalType =
  | 'ice-candidate'
  | 'stream'
  | 'offer'
  | 'answer'
  | 'screen-share'
  | 'moderator-action'
  | 'user-action'
  | 'room-action'

// Базовый интерфейс для всех сигналов
interface BaseSignal {
  type: SignalType
}

// ICE (Interactive Connectivity Establishment) кандидат - это потенциальный путь соединения
// между пирами. Включает информацию о доступных IP адресах, портах и протоколах.
interface IceCandidateSignal extends BaseSignal {
  type: 'ice-candidate';
  candidate: RTCIceCandidate; // Содержит данные о возможном пути соединения
}

// Сигнал медиа потока - используется когда один пир получает аудио/видео поток от другого
interface StreamSignal extends BaseSignal {
  type: 'stream';
  stream: MediaStream;
  mediaState?: {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
  };
}

// SDP (Session Description Protocol) - протокол описания сессии
// Содержит информацию о медиа возможностях пира (кодеки, форматы, и т.д.)
export interface SDPSignal extends BaseSignal {
  type: 'offer' | 'answer'; // offer - предложение соединения, answer - ответ на предложение
  sdp: string; // Строка, описывающая параметры соединения
}

// Объединенный тип для всех возможных сигналов
export type WebRTCSignal =
  | IceCandidateSignal
  | StreamSignal
  | SDPSignal
  | ScreenShareSignal
  | ModeratorActionSignal
  | UserActionSignal
  | RoomActionSignal;

// Информация об участнике конференции
export interface Participant {
  userId: string;
  peer?: RTCPeerConnection; // WebRTC соединение с этим участником
  stream?: MediaStream; // Медиа поток от этого участника
}

// Интерфейс для шаринга экрана
interface ScreenShareSignal extends BaseSignal {
  type: 'screen-share';
  action: 'start' | 'stop';
  stream?: MediaStream;
}

// Интерфейс для действий модератора
interface ModeratorActionSignal extends BaseSignal {
  type: 'moderator-action';
  action: 'mute' | 'kick';
  target?: 'audio' | 'video';
}

// Интерфейс для действий пользователя
interface UserActionSignal extends BaseSignal {
  type: 'user-action';
  action: 'leave' | 'raise-hand';
  userId: string;
  timestamp?: number;
}

// Интерфейс для действий в комнате
interface RoomActionSignal extends BaseSignal {
  type: 'room-action';
  action: 'change-layout' | 'start-recording' | 'stop-recording';
  layout?: 'grid' | 'presentation' | 'focus';
  timestamp?: number;
}

// Пропсы для хука конференции
export interface UseConferenceSocketProps {
  dialogId: string; // Идентификатор комнаты/диалога
  userId?: number; // ID текущего пользователя
  stream?: MediaStream; // Локальный медиа поток (с камеры/микрофона)
  onUserJoined: (userId: string) => void; // Колбэк при присоединении участника
  onUserLeft: (userId: string) => void; // Колбэк при уходе участника
  onSignal: (userId: string, signal: WebRTCSignal) => void; // Колбэк для WebRTC сигналов
  getParticipants: (participants: string[]) => void; // Колбэк для получения списка участников
}

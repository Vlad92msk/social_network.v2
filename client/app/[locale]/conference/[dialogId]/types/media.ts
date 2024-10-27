// Все возможные типы сигналов в WebRTC коммуникации
export type SignalType = 'offer' | 'answer' | 'ice-candidate' | 'stream';

// Базовый интерфейс для всех сигналов
interface BaseSignal {
  type: SignalType;
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
  stream: MediaStream; // Содержит аудио/видео данные
}

// SDP (Session Description Protocol) - протокол описания сессии
// Содержит информацию о медиа возможностях пира (кодеки, форматы, и т.д.)
interface SDPSignal extends BaseSignal {
  type: 'offer' | 'answer'; // offer - предложение соединения, answer - ответ на предложение
  sdp: string; // Строка, описывающая параметры соединения
}

// Объединенный тип для всех возможных сигналов
export type WebRTCSignal = IceCandidateSignal | StreamSignal | SDPSignal;

// Информация об участнике конференции
export interface Participant {
  userId: string;
  peer?: RTCPeerConnection; // WebRTC соединение с этим участником
  stream?: MediaStream; // Медиа поток от этого участника
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

interface WebRTCStateStream {
  localStream?: MediaStream
  streams: Record<string, MediaStream | undefined>
}

interface WebRTCStateDialog {
  currentUserId: string
  dialogId?: string
}

interface WebRTCStateConnection {
  isConnecting: boolean
  connectionStatus: Record<string, RTCPeerConnectionState>
}

interface WebRTCStateSignal {
  iceServers: RTCIceServer[]
}

interface WebRTCStateScreen {
  isSharing: boolean;
  localScreenStream?: MediaStream;
  remoteScreenStreams: Record<string, MediaStream>;
}

export enum WebRTCStateChangeType {
  /**
   * Используется при изменениях, связанных с медиапотоками:
   * - установка/изменение localStream
   * - обновление списка стримов других участников
   * - добавление/удаление треков
   */
  STREAM = 'stream',

  /**
   * Используется при изменениях, связанных с идентификатором диалога:
   * - установка нового dialogId
   * - переключение между диалогами
   * - инициализация нового диалога
   */
  DIALOG = 'dialog',

  /**
   * Используется при изменениях, связанных с WebRTC соединениями:
   * - изменение статуса соединения (connected, disconnected, etc.)
   * - закрытие соединения
   * - обновление списка активных соединений
   */
  CONNECTION = 'connection',

  /**
   * Используется при изменениях, связанных с сигналингом:
   * - обработка ICE кандидатов
   * - обновление состояния после обмена SDP
   * - изменения, связанные с процессом установки соединения
   */
  SIGNAL = 'signal',

  /**
   * Используется при изменениях, связанных с демонстрацией экрана:
   * - начало/остановка демонстрации
   * - управление потоками демонстрации экрана
   * - обновление состояния демонстрации
   */
  SHARING_SCREEN = 'screen',
}

export interface WebRTCState {
  [WebRTCStateChangeType.STREAM]: WebRTCStateStream
  [WebRTCStateChangeType.DIALOG]: WebRTCStateDialog
  [WebRTCStateChangeType.CONNECTION]: WebRTCStateConnection
  [WebRTCStateChangeType.SIGNAL]: WebRTCStateSignal
  [WebRTCStateChangeType.SHARING_SCREEN]: WebRTCStateScreen
}

export enum WebRTCEventsName {
  STATE_CHANGED = 'state:changed',
  CONNECTION_CREATED = 'connection:created',
  SIGNAL_RECEIVED = 'signal:received',
}


// Вспомогательный тип для событий изменения состояния
export type StateChangeEvent = {
  [K in WebRTCStateChangeType]: {
    type: K;
    payload: Partial<WebRTCState[K]>;
  }
}[WebRTCStateChangeType];

// Обновленный интерфейс событий
export interface WebRTCEvents {
  [WebRTCEventsName.STATE_CHANGED]: StateChangeEvent;
  [WebRTCEventsName.CONNECTION_CREATED]: {
    userId: string;
    connection: RTCPeerConnection;
  };
  [WebRTCEventsName.SIGNAL_RECEIVED]: {
    senderId: string;
    signal: any;
  };
}

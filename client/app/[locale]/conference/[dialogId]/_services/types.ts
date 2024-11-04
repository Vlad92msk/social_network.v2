export interface WebRTCState {
  currentUserId: string;
  dialogId?: string;
  iceServers: RTCIceServer[];
  localStream?: MediaStream;
  streams: Record<string, MediaStream | undefined>;
  isConnecting: boolean;
  connectionStatus: Record<string, RTCPeerConnectionState>;
}

export enum WebRTCStateChangeType {
  /**
   * Используется при изменениях, связанных с медиапотоками:
   * - установка/изменение localStream
   * - обновление списка стримов других участников
   * - добавление/удаление треков
   * @example
   * store.setState({ localStream: newStream }, WebRTCStateChangeType.STREAM);
   * store.setState({ streams: { [userId]: stream } }, WebRTCStateChangeType.STREAM);
   */
  STREAM = 'stream',

  /**
   * Используется при изменениях, связанных с идентификатором диалога:
   * - установка нового dialogId
   * - переключение между диалогами
   * - инициализация нового диалога
   * @example
   * store.setState({ dialogId: newDialogId }, WebRTCStateChangeType.DIALOG);
   */
  DIALOG = 'dialog',

  /**
   * Используется при изменениях, связанных с WebRTC соединениями:
   * - изменение статуса соединения (connected, disconnected, etc.)
   * - закрытие соединения
   * - обновление списка активных соединений
   * @example
   * store.setState({
   *   connectionStatus: { [userId]: 'connected' }
   * }, WebRTCStateChangeType.CONNECTION);
   */
  CONNECTION = 'connection',

  /**
   * Используется при изменениях, связанных с сигналингом:
   * - обработка ICE кандидатов
   * - обновление состояния после обмена SDP
   * - изменения, связанные с процессом установки соединения
   * @example
   * store.setState({ isConnecting: true }, WebRTCStateChangeType.SIGNAL);
   */
  SIGNAL = 'signal',
}

export enum WebRTCEventsName {
  STATE_CHANGED = 'state:changed',
  CONNECTION_CREATED = 'connection:created',
  SIGNAL_RECEIVED = 'signal:received',
}

// Обновляем интерфейс событий
export interface WebRTCEvents {
  [WebRTCEventsName.STATE_CHANGED]: {
    type: WebRTCStateChangeType;
    payload: Partial<WebRTCState>;
  };
  [WebRTCEventsName.CONNECTION_CREATED]: {
    userId: string;
    connection: RTCPeerConnection;
  };
  [WebRTCEventsName.SIGNAL_RECEIVED]: {
    senderId: string;
    signal: any;
  };
}

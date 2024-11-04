import { SignalParams } from '../webrtc.service'

export interface PeerConnectionConfig {
  currentUserId: string;
  dialogId?: string;
}

export interface PeerConnectionState {
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export class PeerConnectionManager {
  private connections: Record<string, PeerConnectionState> = {}

  private localStream?: MediaStream

  private config: PeerConnectionConfig

  constructor(
    config: PeerConnectionConfig,
    private sendSignal: (params: SignalParams) => void,
  ) {
    this.config = config
  }

  // Геттеры для доступа к конфигурации
  getCurrentUserId(): string {
    return this.config.currentUserId
  }

  getDialogId(): string | undefined {
    return this.config.dialogId
  }

  // Установка локального стрима
  setLocalStream(stream?: MediaStream) {
    this.localStream = stream
    // Обновляем треки во всех существующих соединениях
    Object.values(this.connections).forEach(({ connection }) => {
      connection.getSenders().forEach((sender) => {
        const track = stream?.getTracks().find((t) => t.kind === sender.track?.kind)
        if (track) sender.replaceTrack(track)
      })
    })
  }

  // Создание нового peer-соединения
  createConnection(
    targetUserId: string,
    onStreamUpdate: (userId: string, stream?: MediaStream) => void,
    onStateChange: (userId: string, state: RTCPeerConnectionState) => void,
  ): RTCPeerConnection {
    // Закрываем существующее соединение
    this.closeConnection(targetUserId)

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    // Отслеживаем изменения состояния
    pc.onconnectionstatechange = () => {
      console.log(`Состояние соединения с пользователем ID ${targetUserId}:`, pc.connectionState)
      onStateChange(targetUserId, pc.connectionState)

      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        this.closeConnection(targetUserId)
        onStreamUpdate(targetUserId, undefined)
      }
    }

    // Добавляем локальные треки
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!)
      })
    }

    // Обработка ICE-кандидатов
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && this.config.dialogId) {
        this.sendSignal({
          targetUserId,
          signal: { type: 'ice-candidate', payload: candidate },
          dialogId: this.config.dialogId,
        })
      }
    }

    // Обработка входящих треков
    pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        onStreamUpdate(targetUserId, event.streams[0])
      }
    }

    this.connections[targetUserId] = { connection: pc }
    return pc
  }

  // Закрытие соединения
  closeConnection(userId: string) {
    const peerState = this.connections[userId]
    if (peerState) {
      peerState.connection.close()
      delete this.connections[userId]
    }
  }

  // Получение соединения по ID пользователя
  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.connections[userId]?.connection
  }

  // Установка ID диалога
  setDialogId(dialogId: string) {
    this.config.dialogId = dialogId
  }

  // Очистка всех соединений
  destroy() {
    Object.keys(this.connections).forEach((userId) => this.closeConnection(userId))
  }
}

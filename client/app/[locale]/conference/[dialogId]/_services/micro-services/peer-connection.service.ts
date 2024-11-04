// Менеджер peer-соединений
import { BaseWebRTCService } from './base.service'
import { PeerConnectionState } from '../types'

export class PeerConnectionManager extends BaseWebRTCService {
  private connections: Record<string, PeerConnectionState> = {}

  // Установка локального стрима
  override setLocalStream(stream?: MediaStream) {
    super.setLocalStream(stream)
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
    onIceCandidate: (candidate: RTCIceCandidateInit) => void,
  ): RTCPeerConnection {
    // Закрываем существующее соединение
    this.closeConnection(targetUserId)

    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
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
      if (candidate) {
        onIceCandidate(candidate)
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

  // Очистка всех соединений
  destroy() {
    Object.keys(this.connections).forEach((userId) => this.closeConnection(userId))
  }
}

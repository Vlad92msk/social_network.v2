import { EventEmitter } from 'events'

export interface Participant {
  userId: string
  stream?: MediaStream // Единый стрим для камеры или демонстрации экрана
  hasActiveStream: boolean // Флаг наличия активного стрима
}

export interface RoomInfo {
  dialogId: string
  participants: string[]
  createdAt: string
}

export class RoomService extends EventEmitter {
  private room?: RoomInfo

  private participants: Map<string, Participant> = new Map()

  /**
   * Инициализация комнаты
   */
  initRoom(roomInfo: RoomInfo): RoomInfo {
    this.room = roomInfo

    // Создаем начальный список участников
    this.participants.clear()
    roomInfo.participants.forEach((userId) => {
      this.participants.set(userId, {
        userId,
        hasActiveStream: false,
      })
    })

    this.emit('roomCreated', roomInfo)
    return roomInfo
  }

  /**
   * Добавление участника
   */
  addParticipant(userId: string): Participant[] {
    if (!this.room) return []

    if (!this.room.participants.includes(userId)) {
      this.room.participants.push(userId)
      this.participants.set(userId, {
        userId,
        hasActiveStream: false,
      })
      this.emit('participantJoined', { userId })
    }

    return Array.from(this.participants.values())
  }

  /**
   * Удаление участника
   */
  removeParticipant(userId: string): Participant[] {
    if (!this.room) return []

    const index = this.room.participants.indexOf(userId)
    if (index !== -1) {
      this.room.participants.splice(index, 1)
      this.participants.delete(userId)
      this.emit('participantLeft', { userId })
    }

    return Array.from(this.participants.values())
  }

  addRemoteStream(userId: string, stream: MediaStream): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    participant.stream = stream
    participant.hasActiveStream = true

    this.participants.set(userId, participant)
    this.emit('streamAdded', { userId, stream })
  }

  removeRemoteStream(userId: string, streamId: string): void {
    const participant = this.participants.get(userId)
    if (!participant || participant.stream?.id !== streamId) return

    participant.stream = undefined
    participant.hasActiveStream = false

    this.participants.set(userId, participant)
    this.emit('streamRemoved', { userId, streamId })
  }
  /**
   * Получение участника по ID
   */
  getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId)
  }

  /**
   * Получение всех участников
   */
  getParticipants(): Participant[] {
    return Array.from(this.participants.values())
  }

  /**
   * Получение всех активных стримов
   */
  getStreams(): { userId: string; stream: MediaStream }[] {
    const streams: { userId: string; stream: MediaStream }[] = []

    this.participants.forEach((participant) => {
      if (participant.stream && participant.hasActiveStream) {
        streams.push({
          userId: participant.userId,
          stream: participant.stream,
        })
      }
    })

    return streams
  }

  /**
   * Очистка при уничтожении
   */
  destroy(): void {
    // Останавливаем все треки во всех стримах
    this.participants.forEach((participant) => {
      participant.stream?.getTracks().forEach((track) => track.stop())
    })

    this.participants.clear()
    this.room = undefined
    this.removeAllListeners()
  }
}

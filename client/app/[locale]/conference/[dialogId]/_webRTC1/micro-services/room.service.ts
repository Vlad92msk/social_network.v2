import { EventEmitter } from 'events'

// Типы для участника конференции
export interface Participant {
  userId: string
  cameraStream?: MediaStream // Стрим с камеры
  screenStream?: MediaStream // Стрим с экрана
  hasCamera?: boolean // Флаг наличия камеры
  isScreenSharing?: boolean // Флаг трансляции экрана
}

export interface RoomInfo {
  dialogId: string
  participants: string[]
  createdAt: string
}

export class RoomService extends EventEmitter {
  private room?: RoomInfo

  private participants: Map<string, Participant> = new Map()

  // Инициализация комнаты
  initRoom(roomInfo: RoomInfo): RoomInfo {
    this.room = roomInfo

    // Создаем начальный список участников
    this.participants.clear()
    roomInfo.participants.forEach((userId) => {
      this.participants.set(userId, { userId })
    })

    this.emit('roomCreated', roomInfo)
    return roomInfo
  }

  // Добавление участника
  addParticipant(userId: string): Participant[] {
    if (!this.room) return []

    if (!this.room.participants.includes(userId)) {
      this.room.participants.push(userId)
      this.participants.set(userId, { userId })
      this.emit('participantJoined', { userId })
    }

    return Array.from(this.participants.values())
  }

  // Удаление участника
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

  // Добавление стрима камеры для участника
  addRemoteStream(userId: string, stream: MediaStream, type: 'camera' | 'screen'): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    if (type === 'camera') {
      participant.cameraStream = stream
      participant.hasCamera = true
    } else {
      participant.screenStream = stream
      participant.isScreenSharing = true
    }

    this.participants.set(userId, participant)
    this.emit('streamAdded', { userId, stream, type })
  }

  // Удаление стрима для участника
  removeRemoteStream(userId: string, type: 'camera' | 'screen'): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    if (type === 'camera') {
      participant.cameraStream = undefined
      participant.hasCamera = false
    } else {
      participant.screenStream = undefined
      participant.isScreenSharing = false
    }

    this.participants.set(userId, participant)
    this.emit('streamRemoved', { userId, type })
  }

  // Получение участника по ID
  getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId)
  }

  // Получение всех участников
  getParticipants(): Participant[] {
    return Array.from(this.participants.values())
  }

  // Получение всех активных стримов
  getStreams(): { userId: string, stream: MediaStream, type: 'camera' | 'screen' }[] {
    const streams: { userId: string, stream: MediaStream, type: 'camera' | 'screen' }[] = []

    this.participants.forEach((participant) => {
      if (participant.cameraStream) {
        streams.push({
          userId: participant.userId,
          stream: participant.cameraStream,
          type: 'camera',
        })
      }
      if (participant.screenStream) {
        streams.push({
          userId: participant.userId,
          stream: participant.screenStream,
          type: 'screen',
        })
      }
    })

    return streams
  }

  // Очистка при уничтожении
  destroy(): void {
    // Останавливаем все треки во всех стримах
    this.participants.forEach((participant) => {
      participant.cameraStream?.getTracks().forEach((track) => track.stop())
      participant.screenStream?.getTracks().forEach((track) => track.stop())
    })

    this.participants.clear()
    this.room = undefined
  }
}

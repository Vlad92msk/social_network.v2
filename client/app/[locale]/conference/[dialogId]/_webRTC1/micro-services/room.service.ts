import { EventEmitter } from 'events'

export interface RoomInfo {
  dialogId: string
  participants: string[]
  createdAt: string
}

export class RoomService extends EventEmitter {
  private room?: RoomInfo

  // Создаем комнату (параметры получаем извне)
  initRoom(roomInfo: RoomInfo): RoomInfo {
    this.room = roomInfo
    this.emit('roomCreated', roomInfo)
    return roomInfo
  }

  // Добавление участника
  addParticipant(userId: string): string[] {
    if (!this.room) return []
    if (!this.room.participants.includes(userId)) {
      this.room.participants.push(userId)
      this.emit('participantJoined', { userId })
    }
    return this.room.participants
  }

  // Удаление участника
  removeParticipant(userId: string): string[] {
    if (!this.room) return []

    const index = this.room.participants.indexOf(userId)
    if (index !== -1) {
      this.room.participants.splice(index, 1)
      this.emit('participantLeft', { userId })
    }
    return this.room.participants
  }

  getParticipants() {
    if (!this.room) return []
    return this.room.participants
  }

  destroy(): void {
    this.room = undefined
  }
}

import { Injectable } from '@nestjs/common'

interface RoomParticipant {
    userId: string;
    joinedAt: Date;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
}

@Injectable()
export class ConferenceService {
    // Храним расширенную информацию об участниках
    private rooms: Map<string, Map<string, RoomParticipant>> = new Map()

    addUserToRoom(dialogId: string, userId: string): string[] {
        if (!this.rooms.has(dialogId)) {
            this.rooms.set(dialogId, new Map())
        }

        const room = this.rooms.get(dialogId)
        room.set(userId, {
            userId,
            joinedAt: new Date(),
            isVideoEnabled: true,
            isAudioEnabled: true,
        })

        return Array.from(room.keys())
    }

    removeUserFromRoom(dialogId: string, userId: string): boolean {
        const room = this.rooms.get(dialogId)
        if (room) {
            const removed = room.delete(userId)
            if (room.size === 0) {
                this.rooms.delete(dialogId)
            }
            return removed
        }
        return false
    }

    getParticipants(dialogId: string): string[] {
        const room = this.rooms.get(dialogId)
        return room ? Array.from(room.keys()) : []
    }

    // Получение полной информации об участниках комнаты
    getRoomInfo(dialogId: string) {
        const room = this.rooms.get(dialogId)
        if (!room) return null

        return {
            dialogId,
            participants: Array.from(room.values()),
            participantsCount: room.size,
            createdAt: Array.from(room.values())
              .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0]?.joinedAt,
        }
    }

    // Обновление состояния медиа для участника
    updateParticipantMediaState(
      dialogId: string,
      userId: string,
      updates: Partial<Pick<RoomParticipant, 'isVideoEnabled' | 'isAudioEnabled'>>,
    ): boolean {
        const room = this.rooms.get(dialogId)
        const participant = room?.get(userId)

        if (participant) {
            room.set(userId, {
                ...participant,
                ...updates,
            })
            return true
        }

        return false
    }
}

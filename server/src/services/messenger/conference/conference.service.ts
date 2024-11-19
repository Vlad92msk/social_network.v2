import { Injectable } from '@nestjs/common'
import { EventType } from '@services/messenger/conference/conference.gateway'

interface RoomParticipant {
    userId: string;
    joinedAt: Date;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
}

type UserEvent = Record<string, {
    mickActive?: boolean
    streamType?: 'camera' | 'screen'
}>

@Injectable()
export class ConferenceService {
    // Храним расширенную информацию об участниках
    private rooms: Map<string, Map<string, RoomParticipant>> = new Map()

    private userEvents: UserEvent = {}

    setUserEvents(props: { streamId: string, payload: any }) {
        console.log('______props', props)
        const { streamId, payload } = props
        this.userEvents[streamId] = {
            ...this.userEvents[streamId],
            mickActive: payload.type === 'mic-on',
            streamType: payload.type,
        }
        console.log('userEvents', this.userEvents)
    }

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
            userEvents: this.userEvents,
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

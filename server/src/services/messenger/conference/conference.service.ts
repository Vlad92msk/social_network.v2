import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'

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

    constructor(private eventEmitter: EventEmitter2) {}

    setUserEvents(props: { streamId: string, payload: any }) {
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
            // Эмитим событие начала конференции при первом участнике
            this.eventEmitter.emit('conference.started', {
                dialogId,
                active: true
            })
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
                // Эмитим событие окончания конференции когда все участники покинули комнату
                this.eventEmitter.emit('conference.ended', {
                    dialogId,
                    active: false
                })
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
}

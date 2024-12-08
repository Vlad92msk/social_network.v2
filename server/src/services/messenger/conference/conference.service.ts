import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserInfo } from '@services/users/user-info/entities'
import { UserInfoService } from '@services/users/user-info/user-info.service'

interface RoomParticipant {
    userId: string;
    joinedAt: Date;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    userInfo: UserInfo
    mickActive: boolean
    streamsType: Record<string, 'camera' | 'screen'>
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

    constructor(
      @Inject(forwardRef(() => UserInfoService))
      private userInfoService: UserInfoService,
      private eventEmitter: EventEmitter2
    ) {}


    async addUserToRoom(dialogId: string, userId: string) {
        if (!this.rooms.has(dialogId)) {
            this.rooms.set(dialogId, new Map())
            // Эмитим событие начала конференции при первом участнике
            this.eventEmitter.emit('conference.started', {
                dialogId,
                active: true
            })
        }
        const userInfo = await this.userInfoService.getUsersById(Number(userId))


        const room = this.rooms.get(dialogId)
        room.set(userId, {
            userId,
            joinedAt: new Date(),
            isVideoEnabled: true,
            isAudioEnabled: true,
            mickActive: false,
            userInfo,
            streamsType: {}
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
    getRoomInfo(dialogId: string, userId: string) {
        const room = this.rooms.get(dialogId)
        if (!room) return null

        return {
            dialogId,
            participants: Array.from(room.values()),
            participantsCount: room.size,
            currentUser: room.get(userId).userInfo,
            createdAt: Array.from(room.values())
              .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0]?.joinedAt,
            userEvents: this.userEvents,
        }
    }
}

import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common'
import { DialogService } from '../dialog/dialog.service'
import { ConfigService } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'
import * as mediasoup from 'mediasoup'
import { types as mediasoupTypes } from 'mediasoup'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class ConferenceService {
    // Хранилище для комнат конференций
    private rooms: Map<string, Set<string>> = new Map()

    // Создание комнаты и добавление пользователя в комнату
    addUserToRoom(dialogId: string, userId: string): string[] {
        if (!this.rooms.has(dialogId)) {
            this.rooms.set(dialogId, new Set())
        }

        this.rooms.get(dialogId)?.add(userId)
        return Array.from(this.rooms.get(dialogId) || [])
    }

    removeUserFromRoom(dialogId: string, userId: string): boolean {
        const room = this.rooms.get(dialogId)
        if (room) {
            room.delete(userId)
            if (room.size === 0) {
                this.rooms.delete(dialogId) // Удаляем комнату, если она пуста
            }
            return true
        }
        return false
    }

    // Получение списка участников комнаты
    getParticipants(dialogId: string): string[] {
        return Array.from(this.rooms.get(dialogId) || [])
    }
}

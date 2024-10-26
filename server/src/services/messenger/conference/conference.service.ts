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
    addUserToRoom(dialogId: string, clientId: string): string[] {
        if (!this.rooms.has(dialogId)) {
            this.rooms.set(dialogId, new Set())
        }

        this.rooms.get(dialogId)?.add(clientId)
        return Array.from(this.rooms.get(dialogId) || [])
    }

    // Удаление пользователя из комнаты
    removeUserFromRoom(dialogId: string, clientId: string): boolean {
        const room = this.rooms.get(dialogId)
        if (room) {
            room.delete(clientId)
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

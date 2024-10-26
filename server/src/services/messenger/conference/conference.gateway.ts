import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection, OnGatewayDisconnect, WebSocketServer
} from '@nestjs/websockets'
import { ConferenceService } from './conference.service'
import { AuthenticatedSocket, VideoConferenceEvents } from './types'
import { types as mediasoupTypes } from 'mediasoup'
import { OnEvent } from '@nestjs/event-emitter'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ namespace: 'conference' })
export class ConferenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server

    // Хранилище комнат и подключенных клиентов
    private rooms: Map<string, Set<string>> = new Map()

    constructor(private conferenceService: ConferenceService) {}

    handleConnection(client: Socket) {
        const { dialogId } = client.handshake.query

        if (typeof dialogId === 'string') {
            client.join(dialogId)

            if (!this.rooms.has(dialogId)) {
                this.rooms.set(dialogId, new Set())
            }
            this.rooms.get(dialogId)?.add(client.id)

            // Оповещаем остальных участников о новом пользователе
            client.to(dialogId).emit('user:joined', client.id)

            // Отправляем новому пользователю список существующих участников
            const participants = Array.from(this.rooms.get(dialogId) || [])
            client.emit('room:participants', participants)
        }
    }

    handleDisconnect(client: Socket) {
        const { dialogId } = client.handshake.query

        if (typeof dialogId === 'string') {
            this.rooms.get(dialogId)?.delete(client.id)
            client.to(dialogId).emit('user:left', client.id)
        }
    }

    @SubscribeMessage('signal')
    handleSignal(client: Socket, data: { targetUserId: string; signal: any }) {
        const { targetUserId, signal } = data
        this.server.to(targetUserId).emit('signal', {
            userId: client.id,
            signal,
        })
    }


}

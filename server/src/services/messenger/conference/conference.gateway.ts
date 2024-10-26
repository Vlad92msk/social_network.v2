import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ConferenceService } from './conference.service'

@WebSocketGateway({
    namespace: 'conference',
})
export class ConferenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server

    constructor(private readonly conferenceService: ConferenceService) {}

    handleConnection(client: Socket) {
        const { dialogId } = client.handshake.query

        if (typeof dialogId === 'string') {
            client.join(dialogId)

            // Добавляем пользователя в комнату через ConferenceService
            const participants = this.conferenceService.addUserToRoom(dialogId, client.id)

            // Оповещаем других участников о новом пользователе
            client.to(dialogId).emit('user:joined', client.id)

            // Отправляем новому пользователю список участников
            client.emit('room:participants', participants)
        }
    }

    handleDisconnect(client: Socket) {
        const { dialogId } = client.handshake.query

        if (typeof dialogId === 'string') {
            // Удаляем пользователя из комнаты через ConferenceService
            const userRemoved = this.conferenceService.removeUserFromRoom(dialogId, client.id)

            if (userRemoved) {
                client.to(dialogId).emit('user:left', client.id)
            }
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

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
        const { dialogId, userId } = client.handshake.query

        // Проверяем, что оба параметра установлены
        if (typeof dialogId === 'string' && typeof userId === 'string') {
            client.join(dialogId)

            // Добавляем пользователя в комнату через ConferenceService
            const participants = this.conferenceService.addUserToRoom(dialogId, userId)

            // Оповещаем других участников о новом пользователе
            client.to(dialogId).emit('user:joined', userId)

            // Отправляем новому пользователю список участников
            client.emit('room:participants', participants)
        }
    }

    handleDisconnect(client: Socket) {
        const { dialogId, userId } = client.handshake.query

        // Проверяем, что оба параметра установлены
        if (typeof dialogId === 'string' && typeof userId === 'string') {
            // Удаляем пользователя из комнаты через ConferenceService
            const userRemoved = this.conferenceService.removeUserFromRoom(dialogId, userId)

            if (userRemoved) {
                client.to(dialogId).emit('user:left', userId)
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

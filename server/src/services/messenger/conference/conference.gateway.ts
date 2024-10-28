import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { WebRTCSignal } from '@services/messenger/conference/types/media'
import { Server, Socket } from 'socket.io'
import { ConferenceService } from './conference.service'


interface SignalPayload {
    targetUserId: string;
    signal: WebRTCSignal;
}

@WebSocketGateway({
    namespace: 'conference',
})
export class ConferenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server

    constructor(private readonly conferenceService: ConferenceService) {}

    handleConnection(client: Socket) {
        const { dialogId, userId } = client.handshake.query

        if (typeof dialogId === 'string' && typeof userId === 'string') {
            // Сохраняем userId в данных сокета для последующего использования
            client.data.userId = userId
            client.join([dialogId, userId]) // Подключаем клиента к комнате диалога и его персональной комнате

            const participants = this.conferenceService.addUserToRoom(dialogId, userId)

            // Оповещаем других участников о новом пользователе
            client.to(dialogId).emit('user:joined', userId)

            // Отправляем новому пользователю список текущих участников
            client.emit('room:participants', participants)

            // Логируем подключение для отладки
            console.log(`User ${userId} connected to room ${dialogId}`)
        } else {
            client.disconnect()
            console.error('Invalid connection parameters')
        }
    }

    handleDisconnect(client: Socket) {
        const { dialogId, userId } = client.handshake.query

        if (typeof dialogId === 'string' && typeof userId === 'string') {
            const userRemoved = this.conferenceService.removeUserFromRoom(dialogId, userId)

            if (userRemoved) {
                // Оповещаем оставшихся участников
                client.to(dialogId).emit('user:left', userId)
                console.log(`User ${userId} disconnected from room ${dialogId}`)
            }
        }
    }

    @SubscribeMessage('signal')
    handleSignal(client: Socket, payload: SignalPayload) {
        const { targetUserId, signal } = payload
        const senderId = client.data.userId

        if (!senderId || !targetUserId || !signal) {
            console.error('Invalid signal payload:', payload)
            return
        }

        // Проверяем тип сигнала и отправляем его целевому пользователю
        this.server.to(targetUserId).emit('signal', {
            userId: senderId,
            signal,
        })

        // Логируем для отладки
        console.log(`Signal ${signal.type} from ${senderId} to ${targetUserId}`)
    }

    // Новый метод для обработки изменений медиа состояния
    @SubscribeMessage('media:state')
    handleMediaState(client: Socket, payload: {
        isVideoEnabled: boolean;
        isAudioEnabled: boolean;
    }) {
        const { dialogId } = client.handshake.query
        const userId = client.data.userId

        if (typeof dialogId === 'string' && userId) {
            client.to(dialogId).emit('user:media', {
                userId,
                ...payload,
            })
        }
    }
}

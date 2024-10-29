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
    server: Server;

    constructor(private readonly conferenceService: ConferenceService) {}

    @SubscribeMessage('signal')
    handleSignal(client: Socket, payload: SignalPayload) {
        const { targetUserId, signal } = payload;
        const senderId = client.data.userId;

        console.log('Server received signal:', {
            from: senderId,
            to: targetUserId,
            type: signal.type,
            timestamp: new Date().toISOString()
        });

        if (!senderId || !targetUserId || !signal) {
            console.error('Invalid signal payload:', payload);
            return;
        }

        // Получаем комнату пользователя
        const dialogId = client.handshake.query.dialogId as string;
        if (!dialogId) {
            console.error('No dialogId found for user:', senderId);
            return;
        }

        // Проверяем, что пользователь существует в комнате
        const participants = this.conferenceService.getParticipants(dialogId);
        if (!participants.includes(targetUserId)) {
            console.error('Target user not found in room:', targetUserId);
            return;
        }

        console.log('Forwarding signal to target user:', {
            from: senderId,
            to: targetUserId,
            type: signal.type
        });

        // Отправляем сигнал целевому пользователю
        this.server.to(targetUserId).emit('signal', {
            userId: senderId,
            signal,
        });

        // Отправляем подтверждение отправителю
        client.emit('signal:sent', {
            to: targetUserId,
            type: signal.type,
            timestamp: new Date().toISOString()
        });
    }

    handleConnection(client: Socket) {
        const { dialogId, userId } = client.handshake.query;

        console.log('Client connecting:', {
            userId,
            dialogId,
            socketId: client.id,
            timestamp: new Date().toISOString()
        });

        if (typeof dialogId === 'string' && typeof userId === 'string') {
            // Сохраняем userId в данных сокета
            client.data.userId = userId;

            // Подключаем к комнате диалога и персональной комнате
            client.join([dialogId, userId]);

            console.log('Client connected:', {
                userId,
                dialogId,
                socketId: client.id,
                rooms: Array.from(client.rooms)
            });

            const participants = this.conferenceService.addUserToRoom(dialogId, userId);

            // Оповещаем других участников
            client.to(dialogId).emit('user:joined', userId);

            // Отправляем новому пользователю список участников
            client.emit('room:participants', participants);

            // Отправляем информацию о комнате
            const roomInfo = this.conferenceService.getRoomInfo(dialogId);
            client.emit('room:info', roomInfo);
        } else {
            console.error('Invalid connection parameters:', {
                dialogId,
                userId
            });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log('Client disconnecting:', {
            socketId: client.id,
            userId: client.data.userId,
            timestamp: new Date().toISOString()
        });

        const { dialogId, userId } = client.handshake.query;

        if (typeof dialogId === 'string' && typeof userId === 'string') {
            const userRemoved = this.conferenceService.removeUserFromRoom(dialogId, userId);
            if (userRemoved) {
                client.to(dialogId).emit('user:left', userId);
            }
        }
    }
}

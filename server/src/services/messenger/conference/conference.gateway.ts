import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    MessageBody,
    ConnectedSocket
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ConferenceService } from './conference.service'

// Типы сигналов WebRTC
type SignalType = 'offer' | 'answer' | 'ice-candidate';

interface WebRTCSignal {
    type: SignalType;
    payload: any;
}

interface SignalPayload {
    targetUserId: string;
    signal: WebRTCSignal;
    dialogId: string;
}

@WebSocketGateway({
    namespace: 'conference',
})
export class ConferenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server

    constructor(private readonly conferenceService: ConferenceService) {}

    @SubscribeMessage('signal')
    handleSignal(
      @ConnectedSocket() client: Socket,
      @MessageBody() payload: SignalPayload
    ) {
        const { targetUserId, signal, dialogId } = payload
        const senderId = client.data.userId

        if (!this.validateSignalPayload(senderId, targetUserId, signal, dialogId)) {
            return
        }

        // Проверяем, что пользователь существует в комнате
        const participants = this.conferenceService.getParticipants(dialogId)
        if (!participants.includes(targetUserId)) {
            client.emit('error', {
                message: 'Target user not found in room',
                code: 'USER_NOT_FOUND'
            })
            return
        }

        // Отправляем сигнал целевому пользователю
        this.server.to(targetUserId).emit(signal.type, {
            userId: senderId,
            signal: signal.payload,
        })

        // Логируем успешную отправку
        this.logSignal(senderId, targetUserId, signal.type)
    }

    private validateSignalPayload(
      senderId: string,
      targetUserId: string,
      signal: WebRTCSignal,
      roomId: string
    ): boolean {
        if (!senderId || !targetUserId || !signal || !roomId) {
            console.error('Invalid signal payload:', { senderId, targetUserId, signal, roomId })
            return false
        }

        const validSignalTypes: SignalType[] = ['offer', 'answer', 'ice-candidate']
        if (!validSignalTypes.includes(signal.type)) {
            console.error('Invalid signal type:', signal.type)
            return false
        }

        return true
    }

    private logSignal(senderId: string, targetUserId: string, type: SignalType) {
        console.log(`WebRTC Signal: ${type}`, {
            from: senderId,
            to: targetUserId,
            timestamp: new Date().toISOString()
        })
    }

    handleConnection(client: Socket) {
        const { dialogId, userId } = client.handshake.query
        console.log(`Подключается пользователь[${userId}] к диалогу[${dialogId}]`)

        if (typeof dialogId !== 'string' || typeof userId !== 'string') {
            console.error('Invalid connection parameters')
            client.disconnect()
            return
        }

        // Инициализация пользователя
        this.initializeUser(client, dialogId, userId)
    }

    private initializeUser(client: Socket, roomId: string, userId: string) {
        client.data.userId = userId
        client.join([roomId, userId])

        const participants = this.conferenceService.addUserToRoom(roomId, userId)

        // Оповещаем других участников
        client.to(roomId).emit('user:joined', {
            userId,
            timestamp: new Date().toISOString(),
            participantsCount: participants.length
        })

        // Отправляем информацию новому участнику
        client.emit('room:info', {
            roomId,
            participants,
            joined: new Date().toISOString(),
            ...this.conferenceService.getRoomInfo(roomId)
        })
    }

    handleDisconnect(client: Socket) {
        const { dialogId, userId } = client.handshake.query

        if (typeof dialogId === 'string' && typeof userId === 'string') {
            this.handleUserDisconnect(dialogId, userId)
        }

        console.log('Client disconnected:', {
            socketId: client.id,
            userId: client.data.userId,
            timestamp: new Date().toISOString()
        })
    }

    private handleUserDisconnect(roomId: string, userId: string) {
        const userRemoved = this.conferenceService.removeUserFromRoom(roomId, userId)

        if (userRemoved) {
            this.server.to(roomId).emit('user:left', {
                userId,
                timestamp: new Date().toISOString(),
                remainingParticipants: this.conferenceService.getParticipants(roomId)
            })
        }
    }
}

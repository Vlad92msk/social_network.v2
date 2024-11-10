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
type SignalType = 'offer' | 'answer' | 'ice-candidate' | 'screen-share' | 'screen-sharing-started' | 'screen-sharing-stopped';


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

        console.log('Received signal:', {
            type: signal.type,
            from: senderId,
            to: targetUserId,
            dialogId,
        })

        if (!this.validateSignalPayload(senderId, targetUserId, signal, dialogId)) {
            console.error('Invalid signal payload')
            return
        }

        // Проверяем, что пользователь существует в комнате
        const participants = this.conferenceService.getParticipants(dialogId)
        if (targetUserId !== 'all') {
            if (!participants.includes(targetUserId)) {
                console.error('Target user not found in room:', {
                    targetUserId,
                    dialogId,
                    participants
                })
                client.emit('error', {
                    message: 'Target user not found in room',
                    code: 'USER_NOT_FOUND'
                })
                return
            }
        }

        console.log('Emitting signal:', {
            type: signal.type,
            to: targetUserId,
            from: senderId,
            participants
        })

        // Отправляем сигнал целевому пользователю
        this.server.to(targetUserId).emit(signal.type, {
            userId: senderId,
            signal,
        })

        this.logSignal(senderId, targetUserId, signal.type)
    }

    private initializeUser(client: Socket, roomId: string, userId: string) {
        console.log('=== INITIALIZE USER ===', {
            socketId: client.id,
            userId,
            roomId,
            timestamp: new Date().toISOString()
        })

        client.data.userId = userId
        client.join(userId)
        client.join(roomId)

        const participants = this.conferenceService.addUserToRoom(roomId, userId)

        // Последовательно логируем и отправляем каждое событие
        console.log('=== SENDING room:participants ===', {
            roomId,
            participants,
            timestamp: new Date().toISOString()
        })
        this.server.to(roomId).emit('room:participants', participants)

        console.log('=== SENDING user:joined ===', {
            roomId,
            userId,
            timestamp: new Date().toISOString()
        })
        this.server.to(roomId).except(client.id).emit('user:joined', userId)

        console.log('=== SENDING room:info ===', {
            roomId,
            userId,
            timestamp: new Date().toISOString()
        })
        client.emit('room:info', {
            roomId,
            joined: new Date().toISOString(),
            ...this.conferenceService.getRoomInfo(roomId),
            participants,
        })
    }

    handleConnection(client: Socket) {
        const { dialogId, userId } = client.handshake.query
        console.log('New connection:', {
            socketId: client.id,
            userId,
            dialogId
        })

        if (typeof dialogId !== 'string' || typeof userId !== 'string') {
            console.error('Invalid connection parameters:', {
                dialogId,
                userId
            })
            client.disconnect()
            return
        }

        this.initializeUser(client, dialogId, userId)
    }

    handleDisconnect(client: Socket) {
        const { dialogId, userId } = client.handshake.query

        console.log('Client disconnecting:', {
            socketId: client.id,
            userId: client.data.userId,
            query: client.handshake.query
        })

        if (typeof dialogId === 'string' && typeof userId === 'string') {
            this.handleUserDisconnect(dialogId, userId)
        }
    }

    private handleUserDisconnect(roomId: string, userId: string) {
        const userRemoved = this.conferenceService.removeUserFromRoom(roomId, userId)

        if (userRemoved) {
            const participants = this.conferenceService.getParticipants(roomId)

            // Отправляем события только в нужную комнату
            this.server.to(roomId).emit('user:left', userId)
            this.server.to(roomId).emit('room:participants', participants)
        }
    }

    private validateSignalPayload(
      senderId: string,
      targetUserId: string,
      signal: WebRTCSignal,
      roomId: string
    ): boolean {
        if (!senderId || !targetUserId || !signal || !roomId) {
            console.error('Invalid signal payload:', {
                senderId,
                targetUserId,
                signal,
                roomId
            })
            return false
        }

        // Добавляем screen-share в список валидных типов сигналов
        const validSignalTypes: SignalType[] = ['offer', 'answer', 'ice-candidate', 'screen-share', 'screen-sharing-started', 'screen-sharing-stopped']
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
            timestamp: new Date().toISOString(),
            isScreenShare: type === 'screen-share'
        })
    }
}

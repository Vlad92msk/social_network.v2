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
type SignalType = 'offer' | 'answer' | 'ice-candidate' | 'screen-share' | 'screen-sharing-started' | 'screen-sharing-stopped' | 'camera-on' | 'camera-off';


interface WebRTCSignal {
    type: SignalType;
    payload: any;
}

interface SignalPayload {
    targetUserId: string;
    signal: WebRTCSignal;
    dialogId: string;
}

export interface EventType {
    event: {
        type: 'mic-on' | 'mic-off'| 'camera-on' | 'camera-off' | 'screen-share-on' | 'screen-share-off'
        payload: any;
    },
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

        console.log('Сигнал:', {
            type: signal.type,
            from: senderId,
            // to: targetUserId,
            // dialogId,
        })

        // if (!this.validateSignalPayload(senderId, targetUserId, signal, dialogId)) {
        //     console.error('Invalid signal payload')
        //     return
        // }

        // Проверяем, что пользователь существует в комнате
        const participants = this.conferenceService.getParticipants(dialogId)


        // Отправляем сигнал целевому пользователю
        this.server.to(targetUserId).emit(signal.type, {
            userId: senderId,
            signal,
        })

        this.logSignal(senderId, targetUserId, signal.type)
    }

    @SubscribeMessage('event')
    async handleEvent(
      @ConnectedSocket() client: Socket,
      @MessageBody() payload: EventType
    ) {
        const { event, dialogId } = payload
        const senderId = client.data.userId

        // Отправляем сигнал целевому пользователю
        client.to(dialogId).emit('user:event', {
            initiator: senderId,
            event,
        })
    }

    private async initializeUser(client: Socket, roomId: string, userId: string) {
        client.data.userId = userId
        client.join(userId)
        client.join(roomId)

        const participants = await this.conferenceService.addUserToRoom(roomId, userId)

        const roomInfo = this.conferenceService.getRoomInfo(roomId, userId)

        this.server.to(roomId).emit('room:participants', participants)
        this.server.to(roomId).except(client.id).emit(
          'user:joined',
          roomInfo.participants.find(({ userId: id }) => userId === id).userInfo
        )

        client.emit('room:info', {
            roomId,
            joined: new Date().toISOString(),
            ...roomInfo,
            participantsIds: participants,
        })
    }

    async handleConnection(client: Socket) {
        const { dialogId, userId } = client.handshake.query

        if (typeof dialogId !== 'string' || typeof userId !== 'string') {
            console.error('Invalid connection parameters:', {
                dialogId,
                userId
            })
            client.disconnect()
            return
        }

        await this.initializeUser(client, dialogId, userId)
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
        const validSignalTypes: SignalType[] = ['offer', 'answer', 'ice-candidate', 'screen-share', 'screen-sharing-started', 'screen-sharing-stopped', 'camera-on', 'camera-off']
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

import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection, OnGatewayDisconnect, WebSocketServer
} from '@nestjs/websockets'
import { VideoConferenceService } from './video-conference.service'
import { AuthenticatedSocket, VideoConferenceEvents } from './types'
import { types as mediasoupTypes } from 'mediasoup'
import { OnEvent } from "@nestjs/event-emitter";
import { Server } from "socket.io";

@WebSocketGateway({ namespace: 'video-conference' })
export class VideoConferenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Хранилище комнат и подключенных клиентов
    private rooms: Map<string, Set<AuthenticatedSocket>> = new Map()

    constructor(private videoConferenceService: VideoConferenceService) {}

    handleConnection(client: AuthenticatedSocket) {
        // Обработка подключения клиента
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: AuthenticatedSocket) {
        // Обработка отключения клиента
        console.log(`Client disconnected: ${client.id}`);
        this.handleClientDisconnect(client);
    }

    // Обработчик события присоединения к конференции
    @SubscribeMessage(VideoConferenceEvents.JOIN_CONFERENCE)
    async handleJoinConference(
        @MessageBody() data: { dialogId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        // Создаем транспорт для пользователя
        const transport = await this.videoConferenceService.joinConference(userId, data.dialogId)

        // Добавляем пользователя в комнату
        if (!this.rooms.has(data.dialogId)) {
            this.rooms.set(data.dialogId, new Set())
        }
        this.rooms.get(data.dialogId).add(client)

        // Присоединяем клиента к комнате Socket.IO
        client.join(data.dialogId)
        // Уведомляем других участников о присоединении нового пользователя
        client.to(data.dialogId).emit(VideoConferenceEvents.USER_JOINED, { userId })

        // Получаем список участников
        const participants = await this.videoConferenceService.getParticipants(data.dialogId)
        // Возвращаем клиенту необходимую информацию для подключения
        return {
            transportOptions: this.videoConferenceService.getTransportOptions(transport),
            routerRtpCapabilities: this.videoConferenceService.getRtpCapabilities(data.dialogId),
            participants: participants.filter(id => id !== userId),
        }
    }

    @SubscribeMessage(VideoConferenceEvents.START_SCREEN_SHARE)
    async handleStartScreenShare(
        @MessageBody() data: { dialogId: string, rtpParameters: mediasoupTypes.RtpParameters },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id;
        const producer = await this.videoConferenceService.createScreenShareProducer(data.dialogId, userId, data.rtpParameters);
        client.to(data.dialogId).emit(VideoConferenceEvents.SCREEN_SHARE_STARTED, { userId, producerId: producer.id });
        return { id: producer.id };
    }

    @SubscribeMessage(VideoConferenceEvents.STOP_SCREEN_SHARE)
    async handleStopScreenShare(
        @MessageBody() data: { dialogId: string, producerId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id;
        await this.videoConferenceService.stopScreenShare(data.dialogId, userId, data.producerId);
        client.to(data.dialogId).emit(VideoConferenceEvents.SCREEN_SHARE_STOPPED, { userId, producerId: data.producerId });
        return { success: true };
    }


    @SubscribeMessage(VideoConferenceEvents.SET_VIDEO_QUALITY)
    async handleSetVideoQuality(
        @MessageBody() data: { dialogId: string, producerId: string, quality: 'low' | 'medium' | 'high' },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const qualitySettings = {
            low: { spatialLayer: 0, temporalLayer: 0 },
            medium: { spatialLayer: 1, temporalLayer: 1 },
            high: { spatialLayer: 2, temporalLayer: 2 },
        };

        const { spatialLayer, temporalLayer } = qualitySettings[data.quality];
        await this.videoConferenceService.setProducerPreferredLayers(data.dialogId, data.producerId, spatialLayer, temporalLayer);
        return { success: true };
    }

    @OnEvent(VideoConferenceEvents.USER_JOINED)
    handleUserJoined(payload: { dialogId: string, userId: number }) {
        this.server.to(payload.dialogId).emit(VideoConferenceEvents.USER_JOINED, { userId: payload.userId });
    }

    @OnEvent(VideoConferenceEvents.CONFERENCE_ENDED)
    handleConferenceEnded(payload: { dialogId: string }) {
        this.server.to(payload.dialogId).emit(VideoConferenceEvents.CONFERENCE_ENDED);
        this.rooms.delete(payload.dialogId);
    }

    @OnEvent(VideoConferenceEvents.SCREEN_SHARE_STARTED)
    handleScreenShareStarted(payload: { dialogId: string, userId: number, producerId: string }) {
        this.server.to(payload.dialogId).emit(VideoConferenceEvents.SCREEN_SHARE_STARTED, { userId: payload.userId, producerId: payload.producerId });
    }

    @OnEvent(VideoConferenceEvents.VIDEO_QUALITY_CHANGED)
    handleVideoQualityChanged(payload: { dialogId: string, producerId: string, spatialLayer: number, temporalLayer: number }) {
        this.server.to(payload.dialogId).emit(VideoConferenceEvents.VIDEO_QUALITY_CHANGED, {
            producerId: payload.producerId,
            spatialLayer: payload.spatialLayer,
            temporalLayer: payload.temporalLayer
        });
    }

    @OnEvent(VideoConferenceEvents.SCREEN_SHARE_STOPPED)
    handleScreenShareStopped(payload: { dialogId: string, userId: number, producerId: string }) {
        this.server.to(payload.dialogId).emit(VideoConferenceEvents.SCREEN_SHARE_STOPPED, { userId: payload.userId, producerId: payload.producerId });
    }

    @OnEvent(VideoConferenceEvents.CONFERENCE_STARTED)
    handleConferenceStarted(payload: { dialogId: string, initiatorId: number }) {
        this.server.to(payload.dialogId).emit(VideoConferenceEvents.CONFERENCE_STARTED, {
            initiatorId: payload.initiatorId
        });
    }

    // Обработчик события покидания конференции
    @SubscribeMessage(VideoConferenceEvents.LEAVE_CONFERENCE)
    handleLeaveConference(
        @MessageBody() data: { dialogId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        this.leaveConference(client, data.dialogId)
        // Уведомляем других участников об уходе пользователя
        client.to(data.dialogId).emit(VideoConferenceEvents.USER_LEFT, { userId })
    }

    // Обработчик подключения транспорта WebRTC
    @SubscribeMessage(VideoConferenceEvents.CONNECT_TRANSPORT)
    async handleConnectTransport(
        @MessageBody() data: { dialogId: string, transportId: string, dtlsParameters: mediasoupTypes.DtlsParameters },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        // Подключаем транспорт на сервере
        await this.videoConferenceService.connectTransport(data.dialogId, userId, data.transportId, data.dtlsParameters)
        return { success: true }
    }

    // Обработчик начала передачи медиапотока
    @SubscribeMessage(VideoConferenceEvents.PRODUCE)
    async handleProduce(
        @MessageBody() data: { dialogId: string, kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        // Создаем производителя медиапотока
        const producer = await this.videoConferenceService.createProducer(data.dialogId, userId, data.rtpParameters, data.kind)
        // Уведомляем других участников о новом производителе
        client.to(data.dialogId).emit(VideoConferenceEvents.NEW_PRODUCER, { userId, producerId: producer.id, kind: producer.kind })
        return { id: producer.id }
    }

    // Обработчик запроса на получение медиапотока
    @SubscribeMessage(VideoConferenceEvents.CONSUME)
    async handleConsume(
        @MessageBody() data: { dialogId: string, producerId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        const producer = await this.videoConferenceService.getProducer(data.dialogId, data.producerId)
        if (producer) {
            // Создаем потребителя медиапотока
            const consumer = await this.videoConferenceService.createConsumer(data.dialogId, userId, producer)
            if (consumer) {
                return {
                    id: consumer.id,
                    producerId: data.producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                    producerPaused: consumer.producerPaused
                }
            }
        }
        return null
    }

    // Обработчик приостановки получения медиапотока
    @SubscribeMessage(VideoConferenceEvents.PAUSE_CONSUMER)
    async handlePauseConsumer(
        @MessageBody() data: { dialogId: string, consumerId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        await this.videoConferenceService.pauseConsumer(data.dialogId, userId, data.consumerId)
        return { success: true }
    }

    // Обработчик возобновления получения медиапотока
    @SubscribeMessage(VideoConferenceEvents.RESUME_CONSUMER)
    async handleResumeConsumer(
        @MessageBody() data: { dialogId: string, consumerId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        await this.videoConferenceService.resumeConsumer(data.dialogId, userId, data.consumerId)
        return { success: true }
    }

    // Обработчик установки предпочтительных слоев для SVC видео
    @SubscribeMessage(VideoConferenceEvents.SET_PREFERRED_LAYERS)
    async handleSetPreferredLayers(
        @MessageBody() data: { dialogId: string, producerId: string, spatialLayer: number, temporalLayer: number },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            await this.videoConferenceService.setProducerPreferredLayers(data.dialogId, data.producerId, data.spatialLayer, data.temporalLayer)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    private leaveConference(client: AuthenticatedSocket, dialogId: string) {
        client.leave(dialogId);
        const room = this.rooms.get(dialogId);
        if (room) {
            room.delete(client);
            if (room.size === 0) {
                this.rooms.delete(dialogId);
                this.videoConferenceService.endConference(dialogId);
            }
        }
    }

    private handleClientDisconnect(client: AuthenticatedSocket) {
        for (const [dialogId, room] of this.rooms.entries()) {
            if (room.has(client)) {
                this.leaveConference(client, dialogId);
                break;
            }
        }
    }
}

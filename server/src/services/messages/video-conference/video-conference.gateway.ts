import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets'
import { VideoConferenceService } from './video-conference.service'
import { AuthenticatedSocket, DialogEvents } from './types'
import { types as mediasoupTypes } from 'mediasoup'

@WebSocketGateway({ namespace: 'video-conference' })
export class VideoConferenceGateway {
    // Хранилище комнат и подключенных клиентов
    private rooms: Map<string, Set<AuthenticatedSocket>> = new Map()

    constructor(private videoConferenceService: VideoConferenceService) {}

    // Обработчик события присоединения к конференции
    @SubscribeMessage(DialogEvents.JOIN_CONFERENCE)
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
        client.to(data.dialogId).emit(DialogEvents.USER_JOINED, { userId })

        // Получаем список участников
        const participants = await this.videoConferenceService.getParticipants(data.dialogId)
        // Возвращаем клиенту необходимую информацию для подключения
        return {
            transportOptions: this.videoConferenceService.getTransportOptions(transport),
            routerRtpCapabilities: this.videoConferenceService.getRtpCapabilities(data.dialogId),
            participants: participants.filter(id => id !== userId),
        }
    }

    // Обработчик события покидания конференции
    @SubscribeMessage(DialogEvents.LEAVE_CONFERENCE)
    handleLeaveConference(
        @MessageBody() data: { dialogId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        this.leaveConference(client, data.dialogId)
        // Уведомляем других участников об уходе пользователя
        client.to(data.dialogId).emit(DialogEvents.USER_LEFT, { userId })
    }

    // Обработчик подключения транспорта WebRTC
    @SubscribeMessage(DialogEvents.CONNECT_TRANSPORT)
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
    @SubscribeMessage(DialogEvents.PRODUCE)
    async handleProduce(
        @MessageBody() data: { dialogId: string, kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        // Создаем производителя медиапотока
        const producer = await this.videoConferenceService.createProducer(data.dialogId, userId, data.rtpParameters, data.kind)
        // Уведомляем других участников о новом производителе
        client.to(data.dialogId).emit(DialogEvents.NEW_PRODUCER, { userId, producerId: producer.id, kind: producer.kind })
        return { id: producer.id }
    }

    // Обработчик запроса на получение медиапотока
    @SubscribeMessage(DialogEvents.CONSUME)
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
    @SubscribeMessage(DialogEvents.PAUSE_CONSUMER)
    async handlePauseConsumer(
        @MessageBody() data: { dialogId: string, consumerId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        await this.videoConferenceService.pauseConsumer(data.dialogId, userId, data.consumerId)
        return { success: true }
    }

    // Обработчик возобновления получения медиапотока
    @SubscribeMessage(DialogEvents.RESUME_CONSUMER)
    async handleResumeConsumer(
        @MessageBody() data: { dialogId: string, consumerId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        const userId = client.requestParams.user_info_id
        await this.videoConferenceService.resumeConsumer(data.dialogId, userId, data.consumerId)
        return { success: true }
    }

    // Обработчик установки предпочтительных слоев для SVC видео
    @SubscribeMessage(DialogEvents.SET_PREFERRED_LAYERS)
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

    // Приватный метод для обработки выхода пользователя из конференции
    private leaveConference(client: AuthenticatedSocket, dialogId: string) {
        // Удаляем клиента из комнаты Socket.IO
        client.leave(dialogId)
        const room = this.rooms.get(dialogId)
        if (room) {
            room.delete(client)
            // Если комната пуста, удаляем ее и завершаем конференцию
            if (room.size === 0) {
                this.rooms.delete(dialogId)
                this.videoConferenceService.endConference(dialogId)
            }
        }
    }
}

import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common'
import { DialogService } from '../dialog/dialog.service'
import { ConfigService } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'
import * as mediasoup from 'mediasoup'
import { types as mediasoupTypes } from 'mediasoup'
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VideoConferenceService {
    private readonly host: string
    private readonly port: string
    private mediasoupWorker: mediasoupTypes.Worker
    // Хранилище для комнат конференций
    private rooms: Map<string, {
        router: mediasoupTypes.Router,
        transports: Map<string, mediasoupTypes.WebRtcTransport>,
        producers: Map<string, mediasoupTypes.Producer>,
        consumers: Map<string, mediasoupTypes.Consumer[]>
    }> = new Map()

    constructor(
        @Inject(forwardRef(() => DialogService))
        private dialogService: DialogService,
        private readonly configService: ConfigService,
        private eventEmitter: EventEmitter2
    ) {
        // Получаем хост и порт из конфигурации
        this.host = this.configService.get(`${ConfigEnum.MAIN}.host`)
        this.port = this.configService.get(`${ConfigEnum.MAIN}.port`)
        this.initializeMediasoup()
    }

    /**
     * Инициализация mediasoup worker'а.
     */
    private async initializeMediasoup() {
        this.mediasoupWorker = await mediasoup.createWorker({
            logLevel: 'warn',
            rtcMinPort: 10000,
            rtcMaxPort: 10100,
        })
    }

    /**
     * Создание новой конференции.
     * @param dialogId ID диалога, для которого создается конференция
     * @returns URL для подключения к конференции
     */
    async createConference(dialogId: string): Promise<string> {
        // Создаем router с поддержкой различных медиа кодеков
        const router = await this.mediasoupWorker.createRouter({
            mediaCodecs: [
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2,
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP9',
                    clockRate: 90000,
                    parameters: {
                        'profile-id': 2,
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '4d0032',
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000,
                    },
                },
            ],
        })

        // Сохраняем информацию о комнате
        this.rooms.set(dialogId, { router, transports: new Map(), producers: new Map(), consumers: new Map() })

        // Возвращаем URL для подключения к конференции
        return `http://${this.host}:${this.port}/conference/${dialogId}`
    }

    /**
     * Присоединение пользователя к конференции.
     * @param userId ID пользователя
     * @param dialogId ID диалога (конференции)
     * @returns WebRtcTransport для пользователя
     */
    async joinConference(userId: number, dialogId: string): Promise<mediasoupTypes.WebRtcTransport> {
        // Проверяем, является ли пользователь участником диалога
        const dialog = await this.dialogService.findOne(dialogId)
        if (!dialog.participants.some(participant => participant.id === userId)) {
            throw new BadRequestException('Вы не являетесь участником этого диалога')
        }

        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        // Создаем WebRtcTransport для пользователя
        const transport = await room.router.createWebRtcTransport({
            listenIps: [
                {
                    ip: '0.0.0.0',
                    announcedIp: this.host,
                },
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate: 1000000,
            enableSctp: true,
        })

        // Сохраняем транспорт пользователя
        room.transports.set(userId.toString(), transport)

        // Оповещаем других участников о присоединении нового пользователя
        this.eventEmitter.emit('conference.userJoined', { dialogId, userId })
        return transport
    }

    /**
     * Завершение конференции и освобождение ресурсов.
     * @param dialogId ID диалога (конференции)
     */
    async endConference(dialogId: string): Promise<void> {
        const room = this.rooms.get(dialogId)
        if (room) {
            // Закрываем все потребители, производители и транспорты
            room.consumers.forEach(consumerArray => consumerArray.forEach(consumer => consumer.close()))
            room.producers.forEach(producer => producer.close())
            room.transports.forEach(transport => transport.close())
            room.router.close()
            // Удаляем комнату из хранилища
            this.rooms.delete(dialogId)
        }
        // Оповещаем всех участников о завершении конференции
        this.eventEmitter.emit('conference.ended', { dialogId })
    }

    /**
     * Создание производителя медиапотока.
     * @param dialogId ID диалога (конференции)
     * @param userId ID пользователя
     * @param rtpParameters RTP параметры
     * @param kind Тип медиа (аудио/видео)
     * @returns Созданный Producer
     */
    async createProducer(dialogId: string, userId: number, rtpParameters: mediasoupTypes.RtpParameters, kind: mediasoupTypes.MediaKind): Promise<mediasoupTypes.Producer> {
        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        const transport = room.transports.get(userId.toString())
        if (!transport) {
            throw new BadRequestException('Транспорт не найден')
        }

        // Создаем производителя
        const producer = await transport.produce({ kind, rtpParameters })
        room.producers.set(producer.id, producer)

        // Создаем потребителей для всех других участников
        for (const [participantId, participantTransport] of room.transports.entries()) {
            if (participantId !== userId.toString()) {
                await this.createConsumer(dialogId, parseInt(participantId), producer)
            }
        }

        return producer
    }

    /**
     * Создание потребителя медиапотока.
     * @param dialogId ID диалога (конференции)
     * @param userId ID пользователя
     * @param producer Producer, для которого создается Consumer
     * @returns Созданный Consumer или null, если не удалось создать
     */
    async createConsumer(dialogId: string, userId: number, producer: mediasoupTypes.Producer): Promise<mediasoupTypes.Consumer | null> {
        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        const transport = room.transports.get(userId.toString())
        if (!transport) {
            throw new BadRequestException('Транспорт не найден')
        }

        // Проверяем, может ли роутер создать потребителя
        if (!room.router.canConsume({
            producerId: producer.id,
            rtpCapabilities: transport.appData.rtpCapabilities,
        })) {
            return null
        }

        // Создаем потребителя
        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities: transport.appData.rtpCapabilities,
            paused: true,
        })

        // Сохраняем потребителя
        if (!room.consumers.has(userId.toString())) {
            room.consumers.set(userId.toString(), [])
        }
        room.consumers.get(userId.toString()).push(consumer)

        return consumer
    }

    /**
     * Получение параметров транспорта для клиента.
     * @param transport WebRtcTransport
     * @returns Параметры транспорта
     */
    getTransportOptions(transport: mediasoupTypes.WebRtcTransport) {
        return {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            sctpParameters: transport.sctpParameters,
        }
    }

    /**
     * Получение RTP возможностей роутера.
     * @param dialogId ID диалога (конференции)
     * @returns RTP возможности или null, если комната не найдена
     */
    getRtpCapabilities(dialogId: string): mediasoupTypes.RtpCapabilities | null {
        const room = this.rooms.get(dialogId)
        return room ? room.router.rtpCapabilities : null
    }

    /**
     * Подключение транспорта (установка DTLS параметров).
     * @param dialogId ID диалога (конференции)
     * @param userId ID пользователя
     * @param transportId ID транспорта
     * @param dtlsParameters DTLS параметры
     */
    async connectTransport(dialogId: string, userId: number, transportId: string, dtlsParameters: mediasoupTypes.DtlsParameters): Promise<void> {
        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        const transport = room.transports.get(userId.toString())
        if (!transport || transport.id !== transportId) {
            throw new BadRequestException('Транспорт не найден')
        }

        // Подключаем транспорт
        await transport.connect({ dtlsParameters })
    }

    /**
     * Приостановка потребителя.
     * @param dialogId ID диалога (конференции)
     * @param userId ID пользователя
     * @param consumerId ID потребителя
     */
    async pauseConsumer(dialogId: string, userId: number, consumerId: string): Promise<void> {
        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        const consumers = room.consumers.get(userId.toString())
        if (!consumers) {
            throw new BadRequestException('Потребители не найдены')
        }

        const consumer = consumers.find(c => c.id === consumerId)
        if (!consumer) {
            throw new BadRequestException('Потребитель не найден')
        }

        // Приостанавливаем потребителя
        await consumer.pause()
    }

    /**
     * Возобновление потребителя.
     * @param dialogId ID диалога (конференции)
     * @param userId ID пользователя
     * @param consumerId ID потребителя
     */
    async resumeConsumer(dialogId: string, userId: number, consumerId: string): Promise<void> {
        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        const consumers = room.consumers.get(userId.toString())
        if (!consumers) {
            throw new BadRequestException('Потребители не найдены')
        }

        const consumer = consumers.find(c => c.id === consumerId)
        if (!consumer) {
            throw new BadRequestException('Потребитель не найден')
        }

        // Возобновляем потребителя
        await consumer.resume()
    }

    async createScreenShareProducer(dialogId: string, userId: number, rtpParameters: mediasoupTypes.RtpParameters): Promise<mediasoupTypes.Producer> {
        const producer = await this.createProducer(dialogId, userId, rtpParameters, 'video');
        producer.appData.screenShare = true;

        // Оповещаем участников о начале демонстрации экрана
        this.eventEmitter.emit('conference.screenShareStarted', { dialogId, userId, producerId: producer.id });

        return producer;
    }

    async stopScreenShare(dialogId: string, userId: number, producerId: string): Promise<void> {
        const room = this.rooms.get(dialogId);
        if (!room) {
            throw new BadRequestException('Конференция не найдена');
        }

        const producer = room.producers.get(producerId);
        if (!producer || !producer.appData.screenShare) {
            throw new BadRequestException('Демонстрация экрана не найдена');
        }

        producer.close();
        room.producers.delete(producerId);

        // Оповещаем участников о завершении демонстрации экрана
        this.eventEmitter.emit('conference.screenShareStopped', { dialogId, userId, producerId });
    }

    /**
     * Установка предпочтительных слоев для SVC видео.
     * @param dialogId ID диалога (конференции)
     * @param producerId ID производителя
     * @param spatialLayer Пространственный слой
     * @param temporalLayer Временной слой
     */
    async setProducerPreferredLayers(dialogId: string, producerId: string, spatialLayer: number, temporalLayer: number): Promise<void> {
        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        const producer = room.producers.get(producerId)
        if (!producer) {
            throw new BadRequestException('Производитель не найден')
        }

        if (producer.kind !== 'video') {
            throw new BadRequestException('Операция доступна только для видео-производителей')
        }

        // Проверяем, поддерживает ли производитель scalabilityMode
        if (!producer.rtpParameters.encodings?.[0]?.scalabilityMode) {
            throw new BadRequestException('Производитель не поддерживает SVC')
        }

        // Сохраняем предпочтительные слои в метаданных производителя
        producer.appData.preferredLayers = { spatialLayer, temporalLayer }

        // Обновляем все потребители, связанные с этим производителем
        for (const [, consumerArray] of room.consumers) {
            for (const consumer of consumerArray) {
                if (consumer.producerId === producerId) {
                    await this.updateConsumerLayers(consumer, spatialLayer, temporalLayer)
                }
            }
        }

        // Оповещаем об изменении качества видео
        this.eventEmitter.emit('conference.videoQualityChanged', { dialogId, producerId, spatialLayer, temporalLayer });
    }

    /**
     * Обновление слоев потребителя.
     * @param consumer Consumer для обновления
     * @param spatialLayer Пространственный слой
     * @param temporalLayer Временной слой
     */
    private async updateConsumerLayers(consumer: mediasoupTypes.Consumer, spatialLayer: number, temporalLayer: number) {
        try {
            await consumer.setPreferredLayers({ spatialLayer, temporalLayer })
            console.log(`Обновлены слои для потребителя ${consumer.id}`)
        } catch (error) {
            console.error('Ошибка при обновлении слоев потребителя:', error)
        }
    }

    /**
     * Получение списка участников конференции.
     * @param dialogId ID диалога (конференции)
     * @returns Массив ID участников
     */
    async getParticipants(dialogId: string): Promise<number[]> {
        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        // Возвращаем список ID участников, преобразуя строковые ключи в числа
        return Array.from(room.transports.keys()).map(Number)
    }

    /**
     * Получение производителя по ID.
     * @param dialogId ID диалога (конференции)
     * @param producerId ID производителя
     * @returns Producer или undefined, если не найден
     */
    async getProducer(dialogId: string, producerId: string): Promise<mediasoupTypes.Producer | undefined> {
        const room = this.rooms.get(dialogId)
        if (!room) {
            throw new BadRequestException('Конференция не найдена')
        }

        return room.producers.get(producerId)
    }
}

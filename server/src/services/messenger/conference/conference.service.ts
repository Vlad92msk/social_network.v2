import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common'
import { DialogService } from '../dialog/dialog.service'
import { ConfigService } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'
import * as mediasoup from 'mediasoup'
import { types as mediasoupTypes } from 'mediasoup'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class ConferenceService {
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
        // this.initializeMediasoup()
    }


}

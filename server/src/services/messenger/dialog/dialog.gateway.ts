import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { DialogService } from './dialog.service'
import { MessageService } from '../message/message.service'
import { BadRequestException, Injectable, UseGuards } from '@nestjs/common'
import { RequestParams, WsRequestParams } from '@shared/decorators'
import { WebsocketDevMiddleware } from './middleware/websocket-dev.middleware'
import { UserStatus } from '@services/users/_interfaces'
import { ClientToServerEvents, ServerToClientEvents, DialogEvents } from './types'
import { OnEvent } from '@nestjs/event-emitter'
import { DialogEntity } from './entities/dialog.entity'
import { DialogShortDto } from './dto/dialog-short.dto'
import { VideoConferenceEvents } from '../video-conference/types'

// Вспомогательная функция для декодирования base64 в File
function base64ToFile(base64: string): Express.Multer.File {
    // Извлекаем MIME-тип и данные из base64 строки
    const matches = base64.match(/^data:(.+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 string')
    }

    const [, mimetype, data] = matches
    const buffer = Buffer.from(data, 'base64')

    // Генерируем случайное имя файла
    const originalname = `file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    return {
        fieldname: 'file',
        originalname,
        encoding: '7bit',
        mimetype,
        buffer,
        size: buffer.length,
    } as Express.Multer.File
}


interface AuthenticatedSocket extends Socket {
    auth: {
        profile_id: string;
        user_info_id: string;
        user_public_id: string;
    };
    data: {
        profile_id: number;
        user_info_id: number;
        user_public_id: string;
    };
}

@Injectable()
@WebSocketGateway({
    namespace: 'dialog',
    cors: {
        origin: '*',
    },
})
@UseGuards(WebsocketDevMiddleware)
export class DialogGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server<ClientToServerEvents, ServerToClientEvents, {}, RequestParams>

    constructor(
        private dialogService: DialogService,
        private messageService: MessageService
    ) {}

    private async handleUserStatusChange(client: AuthenticatedSocket, status: UserStatus): Promise<void> {
        try {
            const userId = client.data.user_info_id
            const dialogs = await this.dialogService.getDialogsByParticipant(userId)

            for (const dialog of dialogs) {
                await this.updateUserStatus(userId, dialog.id, status)
            }
        } catch (error) {
            console.error(`Error handling user status change: ${error.message}`)
            client.emit('error', { message: 'Failed to update user status', error: error.message })
        }
    }

    /**
     * Обновляет статус пользователя в диалоге и оповещает других участников
     */
    private async updateUserStatus(userId: number, dialogId: string, status: UserStatus) {
        // Обновляем статус пользователя в базе данных
        await this.dialogService.updateUserStatus(dialogId, userId, status)
        // Отправляем всем участникам диалога уведомление об изменении статуса
        this.server.to(dialogId).emit(DialogEvents.USER_STATUS_CHANGED, { userId, status })
    }

    /**
     * Получает список активных (онлайн) участников диалога
     */
    private async getActiveParticipants(dialogId: string): Promise<number[]> {
        const sockets = await this.server.in(dialogId).fetchSockets()
        // @ts-ignore
        return sockets.map(socket => (socket as AuthenticatedSocket).data.user_info_id)
    }

    /**
     * Обрабатывает подключение нового клиента
     * @param client Подключившийся клиент
     */
    async handleConnection(client: AuthenticatedSocket) {
        try {
            const { profile_id, user_info_id, user_public_id } = client.handshake.auth

            if (!profile_id || !user_info_id) {
                throw new BadRequestException('Отсутствуют требуемые данные аутентификации')
            }

            client.data = {
                profile_id: Number(profile_id),
                user_info_id: Number(user_info_id),
                user_public_id: String(user_public_id),
            }

            await this.handleUserStatusChange(client, UserStatus.Online)
        } catch (error) {
            console.error('Ошибка при подключении клиента:', error.message)
            client.disconnect()
        }
    }

    /**
     * Обрабатывает отключение клиента
     * @param client Отключившийся клиент
     */
    async handleDisconnect(client: AuthenticatedSocket) {
        await this.handleUserStatusChange(client, UserStatus.Offline)
    }

    /**
     * Обрабатывает присоединение пользователя к диалогу
     * @param data Данные запроса (ID диалога, параметры пагинации)
     * @param client Клиент, присоединяющийся к диалогу
     */
    @SubscribeMessage(DialogEvents.JOIN_DIALOG)
    async handleJoinDialog(
        @MessageBody() data: { dialogId: string, per_page?: number, page?: number },
        @ConnectedSocket() client: AuthenticatedSocket,
        @WsRequestParams() params: RequestParams,
    ) {
        try {
            const { dialogId, per_page = 20, page = 0 } = data

            // Проверяем, является ли пользователь участником диалога
            const dialog = await this.dialogService.findOne(dialogId)
            if (!dialog.participants.some(participant => participant.id === params.user_info_id)) {
                throw new BadRequestException('Вы не являетесь участником этого диалога')
            }

            // Присоединяем клиента к комнате диалога
            await client.join(dialogId)

            // Параллельно получаем сообщения, участников и активных пользователей
            const [messages, participants, activeParticipants] = await Promise.all([
                this.dialogService.getDialogMessages(dialogId, per_page, page, params),
                this.dialogService.getDialogParticipants(dialogId),
                this.getActiveParticipants(dialogId)
            ])

            // Обновляем статус пользователя на 'online' в этом диалоге
            await this.updateUserStatus(params.user_info_id, dialogId, UserStatus.Online)

            // Отправляем историю диалога присоединившемуся клиенту
            client.emit(DialogEvents.DIALOG_HISTORY, { messages, participants, activeParticipants })

            // Оповещаем всех участников диалога о новом активном пользователе
            this.server.to(dialogId).emit(DialogEvents.USER_STATUS_CHANGED, {
                userId: params.user_info_id,
                status: UserStatus.Online,
                activeParticipants
            })
        } catch (error) {
            console.error('Error in handleJoinDialog:', error)
            // Отправляем клиенту сообщение об ошибке
            client.emit('error', { message: 'Failed to join dialog', error: error.message })
        }
    }

    /**
     * Обрабатывает отправку нового сообщения
     * @param data Данные сообщения
     * @param client Клиент, отправляющий сообщение
     */
    @SubscribeMessage(DialogEvents.SEND_MESSAGE)
    async handleSendMessage(
      @MessageBody() data: {
          dialogId?: string;
          message: {
              text: string;
              participants?: number[];
              media?: string[];
              voices?: string[];
              videos?: string[];
          }
      },
      @ConnectedSocket() client: AuthenticatedSocket,
      @WsRequestParams() params: RequestParams,
    ) {
        try {
            const { dialogId, message: { text, participants, media, voices, videos } } = data
            const isNewDialog = !dialogId.length

            console.log('Принимаем такое сообщение', data)
            let currentDialog: DialogEntity

            // Добавляем сообщение в существующий диалог или создаем новый
            if (isNewDialog) {
                // Создаем новый диалог
                if (participants) {
                    currentDialog = await this.dialogService.create({ query: { participants } }, params)
                } else {
                    currentDialog = await this.dialogService.create(undefined, params)
                }
            } else {
                currentDialog = await this.dialogService.findOne(dialogId)
            }

            if (!currentDialog.participants.some(participant => participant.id === params.user_info_id)) {
                throw new BadRequestException('Вы не являетесь участником этого диалога')
            }

            // Декодирование base64 файлов
            const decodedMedia = media ? media.map(base64ToFile) : []
            const decodedVoices = voices ? voices.map(base64ToFile) : []
            const decodedVideos = videos ? videos.map(base64ToFile) : []

            // Создаем сообщение
            const message = await this.messageService.create(
              {
                  createMessageDto: { text },
                  media: decodedMedia,
                  voices: decodedVoices,
                  videos: decodedVideos,
              },
              params
            )
            // Добавляем созданное сообщение в диалог
            const currentDialogWithMessage = await this.dialogService.addMessageToDialog(currentDialog.id, message, params)
            const updatedDialogShort = await this.dialogService.findOneShort(currentDialogWithMessage.id, params)

            if (isNewDialog) {
                // @ts-ignore
                this.server.emit(DialogEvents.NEW_DIALOG, currentDialogWithMessage)
            }

            // Отправляет всем участникам диалога новое сообщение
            this.server.to(currentDialogWithMessage.id).emit(DialogEvents.NEW_MESSAGE, message)

            this.server.emit(DialogEvents.DIALOG_SHORT_UPDATED, updatedDialogShort)

        } catch (error) {
            console.error(`Ошибка отправки сообщения: ${error.message}`)
            client.emit('error', { message: 'Ошибка отправки сообщения', error: error.message })
        }
    }

    /**
     * Обрабатывает выход пользователя из диалога
     * @param dialogId ID диалога
     * @param client Клиент, покидающий диалог
     */
    @SubscribeMessage(DialogEvents.LEAVE_DIALOG)
    async handleLeaveDialog(
      @MessageBody() dialogId: string,
      @ConnectedSocket() client: AuthenticatedSocket,
      @WsRequestParams() params: RequestParams,
    ) {
        // Отсоединяем клиента от комнаты диалога
        client.leave(dialogId)
        // Обновляем статус пользователя на 'offline' в этом диалоге
        await this.updateUserStatus(params.user_info_id, dialogId, UserStatus.Offline)
    }

    /**
     * Обрабатывает начало набора сообщения пользователем
     * @param dialogId ID диалога
     * @param client Клиент, начавший набор
     */
    @SubscribeMessage(DialogEvents.START_TYPING)
    handleStartTyping(
        @MessageBody() dialogId: string,
        @ConnectedSocket() client: AuthenticatedSocket,
      @WsRequestParams() params: RequestParams,
    ) {
        // Оповещаем других участников диалога о начале набора
        client.to(dialogId).emit(DialogEvents.USER_TYPING, { userId: params.user_info_id, isTyping: true })
    }

    /**
     * Обрабатывает окончание набора сообщения пользователем
     * @param dialogId ID диалога
     * @param client Клиент, закончивший набор
     */
    @SubscribeMessage(DialogEvents.STOP_TYPING)
    handleStopTyping(
        @MessageBody() dialogId: string,
        @ConnectedSocket() client: AuthenticatedSocket,
      @WsRequestParams() params: RequestParams,
    ) {
        // Оповещаем других участников диалога об окончании набора
        client.to(dialogId).emit(DialogEvents.USER_TYPING, { userId: params.user_info_id, isTyping: false })
    }


    @OnEvent(DialogEvents.DIALOG_IMAGE_UPDATED)
    handleDialogImageUpdated(payload: { dialogId: string, updatedDialog: DialogEntity }) {
        this.sendDialogUpdate(payload.dialogId, DialogEvents.DIALOG_UPDATED, payload.updatedDialog)
    }

    @OnEvent(DialogEvents.DIALOG_LAST_MESSAGE_UPDATED)
    handleDialogLastMessageUpdated(payload: { dialogId: string, updatedDialogShort: DialogShortDto }) {
        this.sendDialogUpdate(payload.dialogId, DialogEvents.DIALOG_SHORT_UPDATED, payload.updatedDialogShort)
    }

    @OnEvent(VideoConferenceEvents.CONFERENCE_STARTED)
    handleVideoConferenceStarted(payload: { dialogId: string, initiatorId: number }) {
        // Оповещаем всех участников диалога о начале видео-конференции
        this.server.to(payload.dialogId).emit(DialogEvents.VIDEO_CONFERENCE_STARTED, {
            dialogId: payload.dialogId,
            initiatorId: payload.initiatorId
        })
    }

    @OnEvent(VideoConferenceEvents.CONFERENCE_ENDED)
    handleVideoConferenceEnded(payload: { dialogId: string, initiatorId: number }) {
        // Оповещаем всех участников диалога о завершении видео-конференции
        this.server.to(payload.dialogId).emit(DialogEvents.VIDEO_CONFERENCE_ENDED, {
            dialogId: payload.dialogId,
            initiatorId: payload.initiatorId
        })
    }

    /**
     * Отправляет обновление всем клиентам в диалоге
     */
    private sendDialogUpdate(dialogId: string, eventType: DialogEvents, data: any) {
        this.server.to(dialogId).emit(eventType as keyof ServerToClientEvents, data)
    }
}

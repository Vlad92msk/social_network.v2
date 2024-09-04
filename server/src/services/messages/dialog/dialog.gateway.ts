import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets'
import { Server } from 'socket.io'
import { DialogService } from './dialog.service'
import { MessageService } from '../message/message.service'
import { CreateMessageDto } from '../message/dto/create-message.dto'
import { BadRequestException, Injectable, UseGuards } from '@nestjs/common'
import { RequestParams } from '@shared/decorators'
import { WebsocketDevMiddleware } from './middleware/websocket-dev.middleware'
import { UserStatus } from '@services/users/_interfaces'
import { ClientToServerEvents, ServerToClientEvents, DialogEvents, AuthenticatedSocket } from './types'
import { OnEvent } from '@nestjs/event-emitter'
import { DialogEntity } from '@services/messages/dialog/entities/dialog.entity'
import { DialogShortDto } from '@services/messages/dialog/dto/dialog-short.dto'


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
            const userId = client.requestParams.user_info_id
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
        // Получаем все сокеты (подключения) в данном диалоге
        const sockets = await this.server.in(dialogId).fetchSockets()
        // Извлекаем ID пользователей из каждого сокета
        // @ts-ignore используется из-за проблем с типизацией socket.io
        return sockets.map(socket => socket.requestParams.user_info_id)
    }

    /**
     * Обрабатывает подключение нового клиента
     * @param client Подключившийся клиент
     */
    async handleConnection(client: AuthenticatedSocket) {
        await this.handleUserStatusChange(client, UserStatus.Online)
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
    ) {
        try {
            const params: RequestParams = client.requestParams
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
     * Обрабатывает выход пользователя из диалога
     * @param dialogId ID диалога
     * @param client Клиент, покидающий диалог
     */
    @SubscribeMessage(DialogEvents.LEAVE_DIALOG)
    async handleLeaveDialog(
        @MessageBody() dialogId: string,
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        // Отсоединяем клиента от комнаты диалога
        client.leave(dialogId)
        // Обновляем статус пользователя на 'offline' в этом диалоге
        await this.updateUserStatus(client.requestParams.user_info_id, dialogId, UserStatus.Offline)
    }

    /**
     * Обрабатывает отправку нового сообщения
     * @param data Данные сообщения
     * @param client Клиент, отправляющий сообщение
     */
    @SubscribeMessage(DialogEvents.SEND_MESSAGE)
    async handleSendMessage(
        @MessageBody() data: { dialogId: string; createMessageDto: CreateMessageDto; media: Express.Multer.File[]; voices: Express.Multer.File[]; videos: Express.Multer.File[] },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { dialogId, createMessageDto, media, voices, videos } = data
            const params: RequestParams = client.requestParams

            // Проверяем, является ли пользователь участником диалога
            const dialog = await this.dialogService.findOne(dialogId)
            if (!dialog.participants.some(participant => participant.id === params.user_info_id)) {
                throw new BadRequestException('Вы не являетесь участником этого диалога')
            }

            const message = await this.messageService.create({ createMessageDto, media, voices, videos }, params)
            await this.dialogService.updateLastMessage(dialogId, message)

            this.server.to(dialogId).emit(DialogEvents.NEW_MESSAGE, message)

            const updatedDialogShort = await this.dialogService.findOneShort(dialogId)
            this.server.emit(DialogEvents.DIALOG_SHORT_UPDATED, updatedDialogShort)
        } catch (error) {
            console.error(`Error sending message: ${error.message}`)
            client.emit('error', { message: 'Failed to send message', error: error.message })
        }
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
    ) {
        // Оповещаем других участников диалога о начале набора
        client.to(dialogId).emit(DialogEvents.USER_TYPING, { userId: client.requestParams.user_info_id, isTyping: true })
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
    ) {
        // Оповещаем других участников диалога об окончании набора
        client.to(dialogId).emit(DialogEvents.USER_TYPING, { userId: client.requestParams.user_info_id, isTyping: false })
    }


    @OnEvent(DialogEvents.DIALOG_IMAGE_UPDATED)
    handleDialogImageUpdated(payload: { dialogId: string, updatedDialog: DialogEntity }) {
        this.sendDialogUpdate(payload.dialogId, DialogEvents.DIALOG_UPDATED, payload.updatedDialog)
    }

    @OnEvent(DialogEvents.DIALOG_LAST_MESSAGE_UPDATED)
    handleDialogLastMessageUpdated(payload: { dialogId: string, updatedDialogShort: DialogShortDto }) {
        this.sendDialogUpdate(payload.dialogId, DialogEvents.DIALOG_SHORT_UPDATED, payload.updatedDialogShort)
    }

    /**
     * Отправляет обновление всем клиентам в диалоге
     */
    private sendDialogUpdate(dialogId: string, eventType: DialogEvents, data: any) {
        this.server.to(dialogId).emit(eventType as keyof ServerToClientEvents, data)
    }
}

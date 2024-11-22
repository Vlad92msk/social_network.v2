import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets'
import { MessageEntity } from '@services/messenger/message/entity/message.entity'
import { Server, Socket } from 'socket.io'
import { DialogService } from './dialog.service'
import { BadRequestException, Injectable, UseGuards } from '@nestjs/common'
import { RequestParams, WsRequestParams } from '@shared/decorators'
import { WebsocketDevMiddleware } from './middleware/websocket-dev.middleware'
import { UserStatus } from '@services/users/_interfaces'
import { ClientToServerEvents, ServerToClientEvents, DialogEvents } from './types'
import { OnEvent } from '@nestjs/event-emitter'
import { DialogEntity } from './entities/dialog.entity'
import { DialogShortDto } from './dto/dialog-short.dto'


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
    private userSockets = new Map<number, AuthenticatedSocket>()

    constructor(private dialogService: DialogService) {}

    @OnEvent('conference.started')
    async handleConferenceStarted(payload: {dialogId: string, active: boolean}) {
        // Проверяем, является ли пользователь участником диалога
        const dialog = await this.dialogService.getDialogInfo(
          payload.dialogId,
          {
              relations: {
                  participants: true,
                  fixed_messages: false,
                  admins: false,
                  audio: false,
                  media: false,
                  videos: false,
              }
          })
        for (const participantId of dialog.participants) {
            this.sendToUser(participantId.id, 'conference:status', payload)
        }
    }

    @OnEvent('conference.ended')
    async handleConferenceEnded(payload: {dialogId: string, active: boolean}) {
        // Проверяем, является ли пользователь участником диалога
        const dialog = await this.dialogService.getDialogInfo(
          payload.dialogId,
          {
              relations: {
                  participants: true,
                  fixed_messages: false,
                  admins: false,
                  audio: false,
                  media: false,
                  videos: false,
              }
          })
        for (const participantId of dialog.participants) {
            this.sendToUser(participantId.id, 'conference:status', payload)
        }
    }

    /**
     * Обрабатывает подключение нового клиента
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
            this.userSockets.set(user_info_id, client)
        } catch (error) {
            console.error('Ошибка при подключении клиента:', error.message)
            client.disconnect()
        }
    }

    private sendToUser(userId: number, event: string, data: any) {
        if (this.userSockets.has(userId)) {
            const socket = this.userSockets.get(userId)
            socket.emit(event, data)
        }
    }

    /**
     * Обрабатывает присоединение пользователя к диалогу
     */
    @SubscribeMessage(DialogEvents.JOIN_DIALOG)
    async handleJoinDialog(
        @MessageBody() data: { dialogId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
        @WsRequestParams() params: RequestParams,
    ) {
        try {
            const { dialogId } = data
            if (!dialogId) return

            // Проверяем, является ли пользователь участником диалога
            const dialog = await this.dialogService.getDialogInfo(
              dialogId,
              {
                  relations: {
                      participants: true,
                      fixed_messages: true,
                      admins: true,
                      audio: true,
                      media: true,
                      videos: true,
                  }
              })
            if (!dialog.participants.some(participant => participant.id === params.user_info_id)) {
                throw new BadRequestException('Вы не являетесь участником этого диалога')
            }

            // Присоединяем клиента к комнате диалога
            await client.join(dialogId)

            // Получаем активных пользователей
            const activeParticipants = await this.getActiveParticipants(dialogId)

            // Отправляем историю диалога присоединившемуся клиенту
            client.emit(DialogEvents.DIALOG_HISTORY, { dialog, activeParticipants })

            // Оповещаем всех участников диалога о новом активном пользователе
            this.server.to(dialogId).emit(DialogEvents.USER_STATUS_CHANGED, {
                userId: params.user_info_id,
                status: UserStatus.Online,
                // @ts-ignore
                dialogId
            })
        } catch (error) {
            console.error('Error in handleJoinDialog:', error)
            // Отправляем клиенту сообщение об ошибке
            client.emit('error', { message: 'Failed to join dialog', error: error.message })
        }
    }


    /**
     * Обновляет статус пользователя в диалоге и оповещает других участников
     */
    private async updateUserStatus(userId: number, dialogId: string, status: UserStatus) {
        // Отправляем всем участникам диалога уведомление об изменении статуса
        // @ts-ignore
        this.server.to(dialogId).emit(DialogEvents.USER_STATUS_CHANGED, { dialogId, userId, status })
    }

    /**
     * Получает список активных (онлайн) участников диалога
     */
    private async getActiveParticipants(dialogId: string): Promise<number[]> {
        const sockets = await this.server.in(dialogId).fetchSockets()
        // console.log('sockets', sockets)
        // @ts-ignore
        return sockets.map(socket => socket.handshake.auth.user_info_id)
    }

    /**
     * Обрабатывает отключение клиента
     */
    async handleDisconnect(client: AuthenticatedSocket) {
        const { user_info_id } = client.handshake.auth
        this.userSockets.delete(user_info_id)
        await this.handleUserStatusChange(client, UserStatus.Offline)
    }


    private async handleUserStatusChange(client: AuthenticatedSocket, status: UserStatus): Promise<void> {
        try {
            const userId = client.data.user_info_id
        } catch (error) {
            console.error(`Error handling user status change: ${error.message}`)
            client.emit('error', { message: 'Failed to update user status', error: error.message })
        }
    }

    /**
     * Обрабатывает выход пользователя из диалога
     */
    @SubscribeMessage(DialogEvents.LEAVE_DIALOG)
    async handleLeaveDialog(
      @MessageBody() data: { dialogId: string },
      @ConnectedSocket() client: AuthenticatedSocket,
      @WsRequestParams() params: RequestParams,
    ) {
        const { dialogId } = data
        // Отсоединяем клиента от комнаты диалога
        client.leave(dialogId)
        // Обновляем статус пользователя на 'offline' в этом диалоге
        await this.updateUserStatus(params.user_info_id, dialogId, UserStatus.Offline)
    }

    /**
     * Обрабатывает начало набора сообщения пользователем
     */
    @SubscribeMessage(DialogEvents.START_TYPING)
    handleStartTyping(
        @MessageBody() data: { dialogId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
      @WsRequestParams() params: RequestParams,
    ) {
        const { dialogId } = data
        // Оповещаем других участников диалога о начале набора
        client.to(dialogId).emit(DialogEvents.USER_TYPING, { dialogId, userId: params.user_info_id, isTyping: true })
    }

    /**
     * Обрабатывает окончание набора сообщения пользователем
     */
    @SubscribeMessage(DialogEvents.STOP_TYPING)
    handleStopTyping(
        @MessageBody() data: { dialogId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
        @WsRequestParams() params: RequestParams,
    ) {
        const { dialogId } = data
        // Оповещаем других участников диалога об окончании набора
        client.to(dialogId).emit(DialogEvents.USER_TYPING, { dialogId, userId: params.user_info_id, isTyping: false })
    }


    /**
     * Удалить диалог
     */
    @OnEvent(DialogEvents.REMOVE_DIALOG)
    handleRemoveDialog(payload: { id: string, participants: number[] }) {
        const { id, participants } = payload
        participants.forEach((participantId) => {
            this.sendToUser(participantId, DialogEvents.REMOVE_DIALOG, id)
        })

        const sockets = this.server.in(id).fetchSockets()

        sockets.then((connectedSockets) => {
            connectedSockets.forEach((socket) => {
                socket.leave(id)
            })
        })

        // Удаляем комнату
        this.server.in(id).socketsLeave(id)
    }

    /**
     * Покинуть диалог (вообще)
     */
    @OnEvent(DialogEvents.EXIT_DIALOG)
    handleExitDialog(payload: { id: string, participants: number[] }) {
        const { id, participants } = payload
        participants.forEach((participantId) => {
            this.sendToUser(participantId, DialogEvents.EXIT_DIALOG, id)
        })
    }

    @OnEvent(DialogEvents.DIALOG_IMAGE_UPDATED)
    handleDialogImageUpdated(payload: { dialogId: string, updatedDialog: DialogEntity }) {
        this.sendDialogUpdate(payload.dialogId, DialogEvents.DIALOG_UPDATED, payload.updatedDialog)
    }

    @OnEvent(DialogEvents.UPDATED_FIXED_MESSAGES)
    handleUpdateFixedMessages(payload: { dialog_id: string, new_fixed_messages: MessageEntity[] }) {
        const { dialog_id } = payload
        // @ts-ignore
        this.server.to(dialog_id).emit(DialogEvents.UPDATED_FIXED_MESSAGES, payload)
    }

    @OnEvent(DialogEvents.DIALOG_LAST_MESSAGE_UPDATED)
    handleDialogLastMessageUpdated(payload: { dialogId: string, updatedDialogShort: DialogShortDto }) {
        this.sendDialogUpdate(payload.dialogId, DialogEvents.DIALOG_SHORT_UPDATED, payload.updatedDialogShort)
    }


    @OnEvent(DialogEvents.DIALOG_SHORT_UPDATED)
    async createdDialog(payload: { data: any, participants: number[] }) {
        const { data, participants } = payload
        for (const participantId of participants) {
            this.sendToUser(participantId, DialogEvents.DIALOG_SHORT_UPDATED, data)
        }
    }

    @OnEvent(DialogEvents.UPDATE_DIALOG_INFO)
    async updatedDialog(payload: { data: DialogEntity, participants: number[] }) {
        const { data, participants } = payload
        for (const participantId of participants) {
            this.sendToUser(participantId, DialogEvents.UPDATE_DIALOG_INFO, { data })
        }
    }



    @OnEvent(DialogEvents.NEW_MESSAGE)
    async sendMessage(payload: { dialogId: string, message: MessageEntity, isNewDialog: boolean, creator: RequestParams }) {
        const { dialogId, message, isNewDialog, creator } = payload

        // Если это новый диалог - присоединяем автора к нему
        if (isNewDialog && this.userSockets.has(creator.user_info_id)) {
            const socket = this.userSockets.get(creator.user_info_id)
            await this.handleJoinDialog({ dialogId }, socket, creator)
        } else {
            // @ts-ignore
            this.server.to(dialogId).emit(DialogEvents.NEW_MESSAGE, { dialogId, message })
        }
    }

    @OnEvent(DialogEvents.CHANGED_MESSAGE)
    async changeMessage(payload: { message: MessageEntity, creator: RequestParams }) {
        const { message, creator } = payload
        // @ts-ignore
        this.server.to(message.dialog.id).emit(DialogEvents.CHANGED_MESSAGE, { dialogId: message.dialog.id, message })
    }

    @OnEvent(DialogEvents.REMOVE_MESSAGE)
    async removeMessage(payload: { dialogId: string, messageId: string, creator: RequestParams }) {
        const { dialogId, messageId, creator } = payload
        // @ts-ignore
        this.server.to(dialogId).emit(DialogEvents.REMOVE_MESSAGE, { dialogId, messageId })
    }


    /**
     * Отправляет обновление всем клиентам в диалоге
     */
    private sendDialogUpdate(dialogId: string, eventType: DialogEvents, data: any) {
        this.server.to(dialogId).emit(eventType as keyof ServerToClientEvents, data)
    }
}

import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect
} from '@nestjs/websockets'
import { Server } from 'socket.io'
import { DialogService } from './dialog.service'
import { MessageService } from '../message/message.service'
import { CreateMessageDto } from '../message/dto/create-message.dto'
import { Injectable, UseGuards } from '@nestjs/common'
import { RequestParams } from '@shared/decorators'
import { WebsocketDevMiddleware } from './middleware/websocket-dev.middleware'
import { AuthenticatedSocket } from '@shared/types'
import { DialogEvents } from './types/dialog-events-enum'

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
    server: Server

    constructor(
        private dialogService: DialogService,
        private messageService: MessageService
    ) {}

    /**
     * Обновляет статус пользователя в диалоге и оповещает других участников
     * @param userId ID пользователя
     * @param dialogId ID диалога
     * @param status Новый статус пользователя ('online' или 'offline')
     */
    private async updateUserStatus(userId: number, dialogId: string, status: 'online' | 'offline') {
        // Обновляем статус пользователя в базе данных
        await this.dialogService.updateUserStatus(dialogId, userId, status)
        // Отправляем всем участникам диалога уведомление об изменении статуса
        this.server.to(dialogId).emit(DialogEvents.USER_STATUS_CHANGED, { userId, status })
    }

    /**
     * Получает список активных (онлайн) участников диалога
     * @param dialogId ID диалога
     * @returns Массив ID активных участников
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
        const userId = client.requestParams.user_info_id
        // Получаем все диалоги, в которых участвует пользователь
        const dialogs = await this.dialogService.getDialogsByParticipant(userId)

        // Обновляем статус пользователя на 'online' во всех его диалогах
        for (const dialog of dialogs) {
            await this.updateUserStatus(userId, dialog.id, 'online')
        }
    }

    /**
     * Обрабатывает отключение клиента
     * @param client Отключившийся клиент
     */
    async handleDisconnect(client: AuthenticatedSocket) {
        const userId = client.requestParams.user_info_id
        // Получаем все диалоги, в которых участвует пользователь
        const dialogs = await this.dialogService.getDialogsByParticipant(userId)

        // Обновляем статус пользователя на 'offline' во всех его диалогах
        for (const dialog of dialogs) {
            await this.updateUserStatus(userId, dialog.id, 'offline')
        }
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
            const { requestParams } = client
            const { dialogId, per_page = 20, page = 0 } = data

            // Присоединяем клиента к комнате диалога
            await client.join(dialogId)

            // Параллельно получаем сообщения, участников и активных пользователей
            const [messages, participants, activeParticipants] = await Promise.all([
                this.dialogService.getDialogMessages(dialogId, per_page, page, requestParams),
                this.dialogService.getDialogParticipants(dialogId),
                this.getActiveParticipants(dialogId)
            ])

            // Обновляем статус пользователя на 'online' в этом диалоге
            await this.updateUserStatus(requestParams.user_info_id, dialogId, 'online')

            // Отправляем историю диалога присоединившемуся клиенту
            client.emit(DialogEvents.DIALOG_HISTORY, { messages, participants, activeParticipants })

            // Оповещаем всех участников диалога о новом активном пользователе
            this.server.to(dialogId).emit(DialogEvents.USER_STATUS_CHANGED, {
                userId: requestParams.user_info_id,
                status: 'online',
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
        await this.updateUserStatus(client.requestParams.user_info_id, dialogId, 'offline')
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
        const { dialogId, createMessageDto, media, voices, videos } = data
        const params: RequestParams = client.requestParams

        // Создаем новое сообщение
        const message = await this.messageService.create({ createMessageDto, media, voices, videos }, params)
        // Обновляем последнее сообщение в диалоге
        await this.dialogService.updateLastMessage(dialogId, message)

        // Отправляем новое сообщение всем участникам диалога
        this.server.to(dialogId).emit(DialogEvents.NEW_MESSAGE, message)

        // Получаем обновленную краткую информацию о диалоге
        const updatedDialogShort = await this.dialogService.findOneShort(dialogId)
        // Отправляем обновленную информацию о диалоге всем клиентам
        this.server.emit(DialogEvents.DIALOG_SHORT_UPDATED, updatedDialogShort)
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

    /**
     * Отправляет обновление всем клиентам в диалоге
     * @param dialogId ID диалога
     * @param updateType Тип обновления
     * @param data Данные обновления
     */
    sendDialogUpdate(dialogId: string, updateType: string, data: any) {
        this.server.to(dialogId).emit(updateType, data)
    }
}
// Если вы хотите отправить сообщение всем в комнате, кроме текущего пользователя
// (например, уведомление о том, что кто-то печатает), используйте client.to(dialogId).emit(...).
// Если вы хотите отправить сообщение всем в комнате, включая текущего пользователя
// (например, новое сообщение в чате), используйте this.server.to(dialogId).emit(...).
// Если вы хотите отправить сообщение всем подключенным клиентам
// (например, глобальное обновление), используйте this.server.emit(...).

// @WebSocketGateway()
// export class ChatGateway implements OnGatewayConnection {
//     @WebSocketServer()
//     server: Server;
//
//     @SubscribeMessage('joinRoom')
//     handleJoinRoom(client: AuthenticatedSocket, room: string) {
//         client.join(room);
//
//         // Отправляет сообщение всем в комнате, кроме присоединившегося клиента
//         client.to(room).emit('userJoined', { userId: client.requestParams.user_info_id });
//
//         // Отправляет приветственное сообщение только присоединившемуся клиенту
//         client.emit('welcome', { message: 'Welcome to the room!' });
//
//         // Отправляет сообщение всем в комнате, включая присоединившегося клиента
//         this.server.to(room).emit('roomUpdate', { usersCount: this.server.sockets.adapter.rooms.get(room).size });
//
//         // Отправляет сообщение всем подключенным клиентам
//         this.server.emit('globalAnnouncement', { message: 'New user joined a room!' });
//     }
// }

// Серверная часть (NestJS)
// @WebSocketGateway()
// export class ChatGateway {
// @WebSocketServer()
// server: Server;
//
//     @SubscribeMessage('joinRoom')
//     handleJoinRoom(client: AuthenticatedSocket, room: string) {
//         client.join(room);
//         client.to(room).emit('userJoined', { userId: client.requestParams.user_info_id });
//         this.server.to(room).emit('roomUpdate', { usersCount: this.server.sockets.adapter.rooms.get(room).size });
//     }
// }
//
// // Клиентская часть (например, с использованием socket.io-client)
// import { io } from 'socket.io-client';
//
// const socket = io('http://localhost:3000');
//
// // Отправка события на сервер
// function joinRoom(roomId) {
//     socket.emit('joinRoom', roomId);
// }
//
// // Подписка на события от сервера
// socket.on('userJoined', (data) => {
//     console.log(`User ${data.userId} joined the room`);
// });
//
// socket.on('roomUpdate', (data) => {
//     console.log(`Room now has ${data.usersCount} users`);
// });
//
// // Использование
// joinRoom('room1');
// В этом примере:
//
//     Клиент вызывает функцию joinRoom, которая отправляет событие 'joinRoom' на сервер.
//     Сервер получает это событие и обрабатывает его в методе handleJoinRoom.
//     Сервер отправляет два события обратно:
//
//     'userJoined' всем в комнате, кроме присоединившегося клиента.
// 'roomUpdate' всем в комнате, включая присоединившегося клиента.
//
//
//     Клиенты, подписанные на эти события, получают их и выполняют соответствующие действия (в данном случае, выводят сообщения в консоль).

# WebSockets Guide

## Отправка сообщений

- Если вы хотите отправить сообщение всем в комнате, кроме текущего пользователя (например, уведомление о том, что кто-то печатает), используйте `client.to(dialogId).emit(...)`.
- Если вы хотите отправить сообщение всем в комнате, включая текущего пользователя (например, новое сообщение в чате), используйте `this.server.to(dialogId).emit(...)`.
- Если вы хотите отправить сообщение всем подключенным клиентам (например, глобальное обновление), используйте `this.server.emit(...)`.

## Пример кода

### Серверная часть (NestJS)

```typescript
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: AuthenticatedSocket, room: string) {
        client.join(room);

        // Отправляет сообщение всем в комнате, кроме присоединившегося клиента
        client.to(room).emit('userJoined', { userId: client.requestParams.user_info_id });

        // Отправляет приветственное сообщение только присоединившемуся клиенту
        client.emit('welcome', { message: 'Welcome to the room!' });

        // Отправляет сообщение всем в комнате, включая присоединившегося клиента
        this.server.to(room).emit('roomUpdate', { usersCount: this.server.sockets.adapter.rooms.get(room).size });

        // Отправляет сообщение всем подключенным клиентам
        this.server.emit('globalAnnouncement', { message: 'New user joined a room!' });
    }
}
```

### Упрощенный пример

```typescript
@WebSocketGateway()
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: AuthenticatedSocket, room: string) {
        client.join(room);
        client.to(room).emit('userJoined', { userId: client.requestParams.user_info_id });
        this.server.to(room).emit('roomUpdate', { usersCount: this.server.sockets.adapter.rooms.get(room).size });
    }
}
```

### Клиентская часть (с использованием socket.io-client)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Отправка события на сервер
function joinRoom(roomId) {
    socket.emit('joinRoom', roomId);
}

// Подписка на события от сервера
socket.on('userJoined', (data) => {
    console.log(`User ${data.userId} joined the room`);
});

socket.on('roomUpdate', (data) => {
    console.log(`Room now has ${data.usersCount} users`);
});

// Использование
joinRoom('room1');
```

## Пояснение

В этом примере:

1. Клиент вызывает функцию `joinRoom`, которая отправляет событие 'joinRoom' на сервер.
2. Сервер получает это событие и обрабатывает его в методе `handleJoinRoom`.
3. Сервер отправляет два события обратно:
    - 'userJoined' всем в комнате, кроме присоединившегося клиента.
    - 'roomUpdate' всем в комнате, включая присоединившегося клиента.
4. Клиенты, подписанные на эти события, получают их и выполняют соответствующие действия (в данном случае, выводят сообщения в консоль).

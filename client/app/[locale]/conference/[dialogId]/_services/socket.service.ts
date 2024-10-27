// services/socket.service.ts

import { io, Socket } from 'socket.io-client'
import { WebRTCSignal } from '../types/media'

export class SocketService {
  private socket: Socket | null = null

  // Подключение к серверу
  connect(url: string, query: Record<string, any>): Socket {
    this.socket = io(url, {
      path: '/socket.io',
      query,
    })
    return this.socket
  }

  // Отправка сигнала
  sendSignal(targetUserId: string, signal: WebRTCSignal): void {
    this.socket?.emit('signal', { targetUserId, signal })
  }

  // Отправка сообщения в чат
  sendMessage(message: string): void {
    this.socket?.emit('message', { message })
  }

  // Отключение
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

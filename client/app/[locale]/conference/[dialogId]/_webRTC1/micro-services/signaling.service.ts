import { EventEmitter } from 'events'
import { io, Socket } from 'socket.io-client'

export interface SignalingConfig {
  userId: string
  dialogId: string
  url: string
}

/**
 * SignalingService действительно лучше оставить как чистый транспортный слой:
 *
 * Принимает сигналы от сервера
 * Передает их дальше через события
 * Отправляет сигналы на сервер
 * Не содержит бизнес-логики
 */
export class SignalingService extends EventEmitter {
  #socket: Socket | null = null

  #config: SignalingConfig | null = null

  #isConnected = false

  #error: Error | null = null

  init(config: SignalingConfig) {
    if (this.#socket) {
      this.destroy()
    }

    this.#config = config
    this.#socket = io(config.url, {
      path: '/socket.io',
      query: {
        userId: config.userId,
        dialogId: config.dialogId,
      },
    })

    this.#setupSocketListeners()
  }

  #setupSocketListeners() {
    const socket = this.#socket
    if (!socket) return

    socket.on('connect', () => {
      if (socket !== this.#socket) return

      this.#isConnected = true
      this.emit('connected')
      this.emit('stateChanged', this.getState())
    })

    socket.on('disconnect', () => {
      this.#isConnected = false
      this.emit('disconnected')
      this.emit('stateChanged', this.getState())
    })
    socket.on('connect_error', (error: Error) => {
      this.#error = error
      this.emit('error', error)
      this.emit('stateChanged', this.getState())
    })

    socket.on('user:joined', (userId: string) => {
      console.log('userId', userId)
      this.emit('userJoined', userId)
    })

    socket.on('user:left', (userId: string) => {
      this.emit('userLeft', userId)
    })

    socket.on('room:participants', (participants: string[]) => {
      this.emit('participantsUpdated', participants)
    })

    socket.on('room:info', (roomInfo: any) => {
      console.log('roomInfo', roomInfo)
      this.emit('roomInfo', roomInfo)
    })

    socket.on('signal', ({ userId, signal }: { userId: string, signal: any }) => {
      this.emit('signal', { userId, signal })
    })
  }

  sendSignal(targetUserId: string, signal: any) {
    if (!this.#socket || !this.#config) {
      throw new Error('SignalingService is not initialized')
    }

    this.#socket.emit('signal', {
      targetUserId,
      signal,
      dialogId: this.#config.dialogId,
    })
  }

  getState() {
    return {
      isConnected: this.#isConnected,
      error: this.#error,
      config: this.#config,
    }
  }

  destroy() {
    if (this.#socket) {
      this.#socket.disconnect()
      this.#socket = null
    }
    this.#config = null
    this.#isConnected = false
    this.#error = null
    this.removeAllListeners()
  }
}

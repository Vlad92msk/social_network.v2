import { EventEmitter } from 'events'
import { io, Socket } from 'socket.io-client'

// Типы для сигнальных сообщений
type SignalType = 'offer' | 'answer' | 'ice-candidate'

interface SignalMessage {
  type: SignalType
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit
}

export interface SignalingConfig {
  userId: string
  dialogId: string
  url: string
}

/**
 * SignalingService чистый транспортный слой:
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
      this.emit('userJoined', userId)
    })

    socket.on('user:left', (userId: string) => {
      this.emit('userLeft', userId)
    })

    socket.on('room:participants', (participants: string[]) => {
      this.emit('participantsUpdated', participants)
    })

    socket.on('room:info', (roomInfo: any) => {
      this.emit('roomInfo', roomInfo)
    })

    socket.on('offer', ({ userId, signal }: {
      userId: string,
      signal: SignalMessage
    }) => {
      console.log('___offer')
      this.emit('sdp', {
        userId,
        description: signal.payload as RTCSessionDescriptionInit,
      })
    })
    socket.on('answer', ({ userId, signal }: {
      userId: string,
      signal: SignalMessage
    }) => {
      console.log('___answer')
      this.emit('sdp', {
        userId,
        description: signal.payload as RTCSessionDescriptionInit,
      })
    })

    socket.on('ice-candidate', ({ userId, signal }: {
      userId: string,
      signal: SignalMessage
    }) => {
      console.log('___ice-candidate')
      this.emit('iceCandidate', {
        userId,
        candidate: signal.payload as RTCIceCandidateInit,
      })
    })
  }

  // Базовый метод для отправки сигналов
  #sendSignal(targetUserId: string, signal: SignalMessage) {
    if (!this.#socket || !this.#config) {
      throw new Error('SignalingService not initialized')
    }

    this.#socket.emit('signal', {
      targetUserId,
      signal,
      dialogId: this.#config.dialogId,
    })
  }

  // Разделяем sendSignal на специализированные методы
  sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit) {
    this.#sendSignal(targetUserId, {
      type: 'offer',
      payload: offer,
    })
  }

  sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit) {
    this.#sendSignal(targetUserId, {
      type: 'answer',
      payload: answer,
    })
  }

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    this.#sendSignal(targetUserId, {
      type: 'ice-candidate',
      payload: candidate,
    })
  }


  sendSignal(targetUserId: string, signal: any) {
    if (!this.#socket || !this.#config) {
      throw new Error('SignalingService не инициализирован')
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

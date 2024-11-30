import { EventEmitter } from 'events'
import { io, Socket } from 'socket.io-client'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

// Типы для сигнальных сообщений
type SignalType = 'offer' | 'answer' | 'ice-candidate'

export type EventType = {
  type: 'mic-on' | 'mic-off'| 'camera-on' | 'camera-off' | 'screen-share-on' | 'screen-share-off',
  initiator: string
  payload: any
}


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

  async init(config: SignalingConfig): Promise<void> {
    if (this.#socket) {
      this.destroy()
    }

    return new Promise((resolve, reject) => {
      try {
        this.#config = config
        this.#socket = io(config.url, {
          path: '/socket.io',
          query: {
            userId: config.userId,
            dialogId: config.dialogId,
          },
        })

        let cleanupFunction: () => void

        // Обработчик успешного подключения
        const handleConnect = () => {
          this.#isConnected = true
          this.emit('connected')
          this.emit('stateChanged', this.getState())
          cleanupFunction()
          resolve()
        }

        // Обработчик ошибки подключения
        const handleError = (error: Error) => {
          this.#error = error
          this.emit('error', error)
          this.emit('stateChanged', this.getState())
          cleanupFunction()
          reject(error)
        }

        // Функция очистки временных слушателей
        cleanupFunction = () => {
          this.#socket?.off('connect', handleConnect)
          this.#socket?.off('connect_error', handleError)
        }

        // Устанавливаем временные слушатели для инициализации
        this.#socket.once('connect', handleConnect)
        this.#socket.once('connect_error', handleError)

        // Устанавливаем постоянные слушатели
        this.#setupSocketListeners()
      } catch (error) {
        reject(error)
      }
    })
  }

  #setupSocketListeners() {
    const socket = this.#socket
    if (!socket) return

    socket.on('disconnect', () => {
      this.#isConnected = false
      this.emit('disconnected')
      this.emit('stateChanged', this.getState())
    })

    socket.on('user:joined', (userId: UserInfo) => {
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

    socket.on('user:event', (payload: EventType) => {
      console.log(`Получено событие от пользователя ${payload.initiator}`, payload)
      this.emit('userEvent', payload)
    })

    socket.on('offer', ({ userId, signal }: {
      userId: string,
      signal: SignalMessage
    }) => {
      this.emit('sdp', {
        userId,
        description: signal.payload as RTCSessionDescriptionInit,
      })
    })

    socket.on('answer', ({ userId, signal }: {
      userId: string,
      signal: SignalMessage
    }) => {
      this.emit('sdp', {
        userId,
        description: signal.payload as RTCSessionDescriptionInit,
      })
    })

    socket.on('ice-candidate', ({ userId, signal }: {
      userId: string,
      signal: SignalMessage
    }) => {
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

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidate) {
    if (!candidate || !candidate.candidate) {
      console.log('[Signaling] Пропускаем отправку пустого кандидата');
      return;
    }
    console.log(`[Signaling] Отправка ICE кандидата:`, {
      targetUserId,
      foundation: candidate.foundation,
      protocol: candidate.protocol,
      type: candidate.type
    });
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

  sendEvent(event: { type: 'mic-on' | 'mic-off'| 'camera-on' | 'camera-off' | 'screen-share-on' | 'screen-share-off', payload?: any }) {
    if (!this.#socket || !this.#config) {
      throw new Error('SignalingService не инициализирован')
    }

    console.log('событие')

    this.#socket.emit('event', {
      event,
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

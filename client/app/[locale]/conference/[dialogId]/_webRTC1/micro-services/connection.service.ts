import { EventEmitter } from 'events'

type StreamType = 'camera' | 'screen'

interface StreamInfo {
  stream: MediaStream
  type: StreamType
}

/**
 * ConnectionManager управляет WebRTC соединениями.
 * Отвечает за:
 * - Создание и управление RTCPeerConnection
 * - Обработку ICE кандидатов
 * - Управление медиа потоками
 */
export class ConnectionManager extends EventEmitter {
  #initialized = false
  #config: RTCConfiguration
  #connections = new Map<string, RTCPeerConnection>()
  #streams = new Map<string, Map<string, StreamInfo>>() // userId -> streamId -> StreamInfo

  /**
   * События:
   * - error: { message: string, userId?: string }
   * - connectionStateChanged: { userId: string, state: RTCPeerConnectionState }
   * - iceCandidate: { userId: string, candidate: RTCIceCandidate }
   * - track: { userId: string, stream: MediaStream, type: StreamType }
   * - trackEnded: { userId: string, streamId: string, type: StreamType }
   * - negotiationNeeded: { userId: string, description: RTCSessionDescription }
   */

  async init(config: RTCConfiguration): Promise<void> {
    try {
      this.#config = config
      this.#initialized = true
      console.log('🚀 ConnectionManager инициализирован')
    } catch (error) {
      const msg = 'Ошибка инициализации ConnectionManager'
      console.error(msg, error)
      this.emit('error', { message: msg })
      throw new Error(msg)
    }
  }

  async createConnection(userId: string): Promise<void> {
    this.#checkInitialized()

    try {
      console.log(`📞 Создаем соединение для пользователя ${userId}`)
      const connection = new RTCPeerConnection(this.#config)

      // Обработка изменения состояния соединения
      connection.onconnectionstatechange = () => {
        const state = connection.connectionState
        console.log(`🔄 Состояние соединения с ${userId}: ${state}`)

        this.emit('connectionStateChanged', { userId, state })

        if (state === 'failed') {
          console.log(`⚠️ Пытаемся перезапустить ICE для ${userId}`)
          connection.restartIce()
        }
      }

      // Обработка ICE кандидатов
      connection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          console.log(`🧊 Новый ICE кандидат для ${userId}`)
          this.emit('iceCandidate', { userId, candidate })
        }
      }

      // Обработка новых треков
      connection.ontrack = (event) => {
        const stream = event.streams[0]
        if (!stream) return

        // Определяем тип потока по количеству треков
        const type: StreamType = event.track.kind === 'video'
          ? (stream.getVideoTracks().length > 1 ? 'screen' : 'camera')
          : 'camera'

        console.log(`📡 Получен трек от ${userId}: ${type}`)
        this.emit('track', { userId, stream, type })

        // Сохраняем информацию о потоке
        if (!this.#streams.has(userId)) {
          this.#streams.set(userId, new Map())
        }
        this.#streams.get(userId)!.set(stream.id, { stream, type })

        // Отслеживаем завершение трека
        event.track.onended = () => {
          console.log(`🛑 Трек завершен: ${userId}, ${type}`)
          this.#streams.get(userId)?.delete(stream.id)
          this.emit('trackEnded', { userId, streamId: stream.id, type })
        }
      }

      // Обработка необходимости согласования
      connection.onnegotiationneeded = async () => {
        try {
          if (connection.signalingState === 'stable') {
            const offer = await connection.createOffer()
            await connection.setLocalDescription(offer)
            console.log(`📝 Требуется согласование с ${userId}`)
            this.emit('negotiationNeeded', {
              userId,
              description: connection.localDescription!
            })
          }
        } catch (error) {
          const msg = `Ошибка создания предложения для ${userId}`
          console.error(msg, error)
          this.emit('error', { message: msg, userId })
        }
      }

      this.#connections.set(userId, connection)

    } catch (error) {
      const msg = `Ошибка создания соединения для ${userId}`
      console.error(msg, error)
      this.emit('error', { message: msg, userId })
      throw new Error(msg)
    }
  }

  async addStream(userId: string, stream: MediaStream, type: StreamType): Promise<void> {
    const connection = this.#getConnection(userId)

    try {
      console.log(`📤 Добавление ${type} потока для ${userId}`)

      // Добавляем треки в соединение
      const tracks = stream.getTracks()
      for (const track of tracks) {
        const sender = connection.addTrack(track, stream)

        // Настраиваем параметры видео
        if (track.kind === 'video') {
          const params = sender.getParameters()
          params.encodings = [{
            maxBitrate: type === 'screen' ? 2500000 : 1000000,
            maxFramerate: 30
          }]
          await sender.setParameters(params)
        }
      }

      // Сохраняем информацию о потоке
      if (!this.#streams.has(userId)) {
        this.#streams.set(userId, new Map())
      }
      this.#streams.get(userId)!.set(stream.id, { stream, type })

    } catch (error) {
      const msg = `Ошибка добавления ${type} потока для ${userId}`
      console.error(msg, error)
      this.emit('error', { message: msg, userId })
      throw new Error(msg)
    }
  }

  async removeStream(userId: string, streamId: string): Promise<void> {
    const connection = this.#getConnection(userId)
    const streamInfo = this.#streams.get(userId)?.get(streamId)

    if (!streamInfo) {
      console.warn(`⚠️ Поток ${streamId} не найден для ${userId}`)
      return
    }

    try {
      console.log(`🗑️ Удаление потока ${streamId} для ${userId}`)

      const senders = connection.getSenders()
      const tracks = streamInfo.stream.getTracks()

      for (const track of tracks) {
        const sender = senders.find(s => s.track === track)
        if (sender) {
          await connection.removeTrack(sender)
        }
      }

      this.#streams.get(userId)?.delete(streamId)

    } catch (error) {
      const msg = `Ошибка удаления потока для ${userId}`
      console.error(msg, error)
      this.emit('error', { message: msg, userId })
      throw new Error(msg)
    }
  }

  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const connection = this.#getConnection(userId)

    try {
      console.log(`📥 Обработка предложения от ${userId}`)
      await connection.setRemoteDescription(new RTCSessionDescription(offer))

      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)

      return answer

    } catch (error) {
      const msg = `Ошибка обработки предложения от ${userId}`
      console.error(msg, error)
      this.emit('error', { message: msg, userId })
      throw new Error(msg)
    }
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.#getConnection(userId)

    try {
      console.log(`📥 Обработка ответа от ${userId}`)
      await connection.setRemoteDescription(new RTCSessionDescription(answer))

    } catch (error) {
      const msg = `Ошибка обработки ответа от ${userId}`
      console.error(msg, error)
      this.emit('error', { message: msg, userId })
      throw new Error(msg)
    }
  }

  async addIceCandidate(userId: string, candidate: RTCIceCandidate): Promise<void> {
    const connection = this.#getConnection(userId)

    try {
      console.log(`🧊 Добавление ICE кандидата для ${userId}`)
      await connection.addIceCandidate(candidate)

    } catch (error) {
      const msg = `Ошибка добавления ICE кандидата для ${userId}`
      console.error(msg, error)
      // Не выбрасываем ошибку, так как это нормальная ситуация
      this.emit('error', { message: msg, userId })
    }
  }

  closeConnection(userId: string): void {
    try {
      const connection = this.#connections.get(userId)
      if (connection) {
        console.log(`👋 Закрытие соединения с ${userId}`)

        // Останавливаем все треки
        connection.getSenders().forEach(sender => {
          if (sender.track) sender.track.stop()
        })

        connection.close()
        this.#connections.delete(userId)
        this.#streams.delete(userId)
      }
    } catch (error) {
      const msg = `Ошибка закрытия соединения с ${userId}`
      console.error(msg, error)
      this.emit('error', { message: msg, userId })
    }
  }

  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.#connections.get(userId)
  }

  getStreams(userId: string): StreamInfo[] {
    return Array.from(this.#streams.get(userId)?.values() || [])
  }

  destroy(): void {
    if (this.#initialized) {
      console.log('🧹 Очистка ConnectionManager')

      // Закрываем все соединения
      for (const userId of this.#connections.keys()) {
        this.closeConnection(userId)
      }

      this.#connections.clear()
      this.#streams.clear()
      this.removeAllListeners()
      this.#initialized = false
    }
  }

  #getConnection(userId: string): RTCPeerConnection {
    const connection = this.#connections.get(userId)
    if (!connection) {
      throw new Error(`Соединение не найдено для пользователя ${userId}`)
    }
    return connection
  }

  #checkInitialized(): void {
    if (!this.#initialized) {
      throw new Error('ConnectionManager не инициализирован')
    }
  }
}

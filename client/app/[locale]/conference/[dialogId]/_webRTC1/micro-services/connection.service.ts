import { EventEmitter } from 'events'

interface StreamInfo {
  stream: MediaStream
}

/**
 * ConnectionManager отвечает за управление WebRTC соединениями
 * Основные задачи:
 * - Создание и закрытие соединений
 * - Управление медиа потоками (добавление/удаление)
 * - Обмен SDP (offer/answer)
 */
export class ConnectionManager extends EventEmitter {
  #connections = new Map<string, RTCPeerConnection>()

  #streams = new Map<string, Map<string, StreamInfo>>()

  #config: RTCConfiguration

  async init(config: RTCConfiguration): Promise<void> {
    this.#config = config
    console.log('🚀 ConnectionManager инициализирован')
  }

  /**
   * Создание нового соединения
   */
  async createConnection(userId: string): Promise<void> {
    console.log(`📞 Создание соединения для ${userId}`)

    // Закрываем существующее соединение если есть
    this.closeConnection(userId)

    const connection = new RTCPeerConnection(this.#config)

    // Обработка изменения состояния
    connection.onconnectionstatechange = () => {
      const state = connection.connectionState
      console.log(`🔄 Состояние соединения с ${userId}: ${state}`)
      this.emit('connectionStateChanged', { userId, state })
    }

    // Обработка ICE кандидатов
    connection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log(`🧊 ICE кандидат для ${userId}`)
        this.emit('iceCandidate', { userId, candidate })
      }
    }

    // Обработка входящих треков
    connection.ontrack = (event) => {
      const stream = event.streams[0]
      if (!stream) return

      console.log(`📡 Получен трек от ${userId}`)

      // Сохраняем информацию о потоке
      if (!this.#streams.has(userId)) {
        this.#streams.set(userId, new Map())
      }
      this.#streams.get(userId)!.set(stream.id, { stream })

      // Оповещаем о новом треке
      this.emit('track', { userId, stream })

      // Обработка завершения трека
      event.track.onended = () => {
        console.log(`🛑 Трек завершен от ${userId}`)
        this.#streams.get(userId)?.delete(stream.id)
        this.emit('trackEnded', { userId, streamId: stream.id })
      }
    }

    // Обработка необходимости согласования
    connection.onnegotiationneeded = async () => {
      try {
        if (connection.signalingState === 'stable') {
          const offer = await connection.createOffer()
          await connection.setLocalDescription(offer)
          this.emit('negotiationNeeded', {
            userId,
            description: connection.localDescription!,
          })
        }
      } catch (error) {
        console.error(`❌ Ошибка согласования для ${userId}:`, error)
      }
    }

    this.#connections.set(userId, connection)
  }

  /**
   * Добавление медиа потока
   */
  async addStream(userId: string, stream: MediaStream): Promise<void> {
    const connection = this.#connections.get(userId)
    if (!connection) return

    console.log(`📤 Добавление потока для ${userId}`)

    try {
      // Получаем существующие отправители
      const senders = connection.getSenders()

      // Добавляем треки
      for (const track of stream.getTracks()) {
        const sender = senders.find((s) => s.track?.kind === track.kind)

        if (sender) {
          await sender.replaceTrack(track)
        } else {
          connection.addTrack(track, stream)
        }
      }

      // Сохраняем информацию о потоке
      if (!this.#streams.has(userId)) {
        this.#streams.set(userId, new Map())
      }
      this.#streams.get(userId)!.set(stream.id, { stream })
    } catch (error) {
      console.error(`❌ Ошибка добавления потока для ${userId}:`, error)
      throw error
    }
  }

  /**
   * Удаление медиа потока
   */
  async removeStream(userId: string, streamId: string): Promise<void> {
    const connection = this.#connections.get(userId)
    const streamInfo = this.#streams.get(userId)?.get(streamId)

    if (!connection || !streamInfo) return

    console.log(`🗑️ Удаление потока для ${userId}`)

    try {
      // Удаляем все отправители
      connection.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop()
          connection.removeTrack(sender)
        }
      })

      // Удаляем информацию о потоке
      this.#streams.get(userId)?.delete(streamId)
    } catch (error) {
      console.error(`❌ Ошибка удаления потока для ${userId}:`, error)
      throw error
    }
  }

  /**
   * Обработка входящего offer
   */
  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const connection = this.#connections.get(userId)
    if (!connection) throw new Error(`Нет соединения с ${userId}`)

    console.log(`📥 Обработка offer от ${userId}`)

    await connection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await connection.createAnswer()
    await connection.setLocalDescription(answer)

    return answer
  }

  /**
   * Обработка входящего answer
   */
  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.#connections.get(userId)
    if (!connection) throw new Error(`Нет соединения с ${userId}`)

    console.log(`📥 Обработка answer от ${userId}`)
    await connection.setRemoteDescription(new RTCSessionDescription(answer))
  }

  /**
   * Добавление ICE кандидата
   */
  async addIceCandidate(userId: string, candidate: RTCIceCandidate): Promise<void> {
    const connection = this.#connections.get(userId)
    if (!connection) return

    try {
      await connection.addIceCandidate(candidate)
    } catch (error) {
      console.warn(`⚠️ Ошибка добавления ICE кандидата для ${userId}:`, error)
    }
  }

  /**
   * Закрытие соединения
   */
  closeConnection(userId: string): void {
    const connection = this.#connections.get(userId)
    if (!connection) return

    console.log(`👋 Закрытие соединения с ${userId}`)

    // Останавливаем все треки
    connection.getSenders().forEach((sender) => {
      if (sender.track) sender.track.stop()
    })

    // Закрываем соединение
    connection.close()

    // Очищаем данные
    this.#connections.delete(userId)
    this.#streams.delete(userId)
  }

  /**
   * Получение списка потоков пользователя
   */
  getStreams(userId: string): StreamInfo[] {
    return Array.from(this.#streams.get(userId)?.values() || [])
  }

  /**
   * Получение соединения
   */
  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.#connections.get(userId)
  }

  /**
   * Очистка всех ресурсов
   */
  destroy(): void {
    // Закрываем все соединения
    for (const userId of this.#connections.keys()) {
      this.closeConnection(userId)
    }

    // Очищаем все данные
    this.#connections.clear()
    this.#streams.clear()
    this.removeAllListeners()
  }
}

import { EventEmitter } from 'events'

interface StreamInfo {
  stream: MediaStream;
  tracks: RTCRtpSender[];
}

type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export class ConnectionManager extends EventEmitter {
  private connections = new Map<string, RTCPeerConnection>()

  private streams = new Map<string, Map<string, StreamInfo>>()

  private iceCandidatesBuffer = new Map<string, RTCIceCandidate[]>()

  private config: RTCConfiguration

  constructor() {
    super()
    this.setMaxListeners(100)
  }

  async init(config: RTCConfiguration): Promise<void> {
    this.config = config
  }

  async createConnection(userId: string): Promise<void> {
    try {
      this.close(userId)

      const connection = new RTCPeerConnection(this.config)
      console.log('Creating connection for user:', userId)

      connection.onconnectionstatechange = () => {
        this.emit('connectionState', {
          userId,
          state: connection.connectionState as ConnectionState,
        })
      }

      connection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          this.emit('iceCandidate', { userId, candidate })
        }
      }

      connection.ontrack = ({ track, streams }) => {
        const stream = streams[0]
        if (!stream) {
          this.emit('error', { userId, error: new Error('No stream received with track') })
          return
        }

        this.emit('track', { userId, track, stream })

        track.onended = () => {
          this.emit('trackEnded', { userId, trackId: track.id })
        }
      }

      this.connections.set(userId, connection)
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Failed to create connection'),
      })
      throw error
    }
  }

  /**
   * Создание offer для установки соединения
   */
  async createOffer(userId: string): Promise<RTCSessionDescriptionInit | undefined> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`No connection found for user ${userId}`)
    }

    try {
      // Проверяем текущее состояние
      if (connection.signalingState !== 'stable') {
        console.log(`⚠️ Пропуск создания offer - некорректное состояние: ${connection.signalingState}`)
        return
      }

      // Проверяем наличие отправляемых треков
      const senders = connection.getSenders()
      if (senders.length === 0) {
        console.log('⚠️ Нет треков для отправки, пропуск создания offer')
        return
      }

      console.log(`📝 Создание offer для ${userId}, количество треков: ${senders.length}`)
      const offer = await connection.createOffer()
      console.log('Offer создан:', offer)

      await connection.setLocalDescription(offer)
      console.log('Local description установлен')

      return offer
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Failed to create offer'),
      })
      throw error
    }
  }

  /**
   * Удаление медиа трека из соединения
   */
  async removeTrack(userId: string, trackId: string): Promise<void> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`No connection found for user ${userId}`)
    }

    try {
      const sender = connection.getSenders().find((s) => s.track?.id === trackId)
      if (sender) {
        await connection.removeTrack(sender)

        // Обновляем информацию о стримах
        const userStreams = this.streams.get(userId)
        if (userStreams) {
          userStreams.forEach((streamInfo, streamId) => {
            streamInfo.tracks = streamInfo.tracks.filter((s) => s !== sender)
            if (streamInfo.tracks.length === 0) {
              userStreams.delete(streamId)
            }
          })
        }
      }
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Failed to remove track'),
      })
      throw error
    }
  }

  async addTrack(userId: string, track: MediaStreamTrack, stream: MediaStream): Promise<void> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`No connection found for user ${userId}`)
    }

    try {
      console.log(`Adding ${track.kind} track to connection for user ${userId}`)
      const sender = connection.addTrack(track, stream)

      if (!this.streams.has(userId)) {
        this.streams.set(userId, new Map())
      }

      const userStreams = this.streams.get(userId)!
      const streamInfo = userStreams.get(stream.id) || { stream, tracks: [] }
      streamInfo.tracks.push(sender)
      userStreams.set(stream.id, streamInfo)
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Failed to add track'),
      })
      throw error
    }
  }

  /**
   * Получение текущего соединения по userId
   */
  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.connections.get(userId)
  }

  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    console.log('🤝 Обработка offer для:', userId, 'offer:', offer)

    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`No connection found for user ${userId}`)
    }

    try {
      if (!offer.sdp) {
        throw new Error('Invalid offer: no SDP')
      }

      const rtcOffer = new RTCSessionDescription({
        type: 'offer',
        sdp: offer.sdp,
      })

      console.log('📥 Установка remote description')
      await connection.setRemoteDescription(rtcOffer)

      // Добавляем буферизованные ICE кандидаты после установки remote description
      await this.addBufferedCandidates(userId)

      console.log('📝 Создание answer')
      const answer = await connection.createAnswer()

      console.log('📤 Установка local description')
      await connection.setLocalDescription(answer)

      if (!answer.sdp) {
        throw new Error('Created answer has no SDP')
      }

      return {
        type: 'answer',
        sdp: answer.sdp,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Ошибка в handleOffer:', errorMessage)
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error(errorMessage),
      })
      throw error
    }
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Нет соединения с пользователем ${userId}`)
    }

    try {
      await connection.setRemoteDescription(new RTCSessionDescription(answer))
      // Добавляем буферизованные ICE кандидаты после установки remote description
      await this.addBufferedCandidates(userId)
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Failed to handle answer'),
      })
      throw error
    }
  }

  async addIceCandidate(userId: string, candidate: RTCIceCandidate): Promise<void> {
    const connection = this.connections.get(userId)

    if (!connection) {
      throw new Error(`Нет соединения с пользователем ${userId}`)
    }

    try {
      if (connection.remoteDescription) {
        // Если remote description установлен, добавляем кандидата сразу
        await connection.addIceCandidate(candidate)
      } else {
        // Иначе буферизуем кандидата
        console.log(`📦 Буферизация ICE кандидата для ${userId}`)
        if (!this.iceCandidatesBuffer.has(userId)) {
          this.iceCandidatesBuffer.set(userId, [])
        }
        this.iceCandidatesBuffer.get(userId)!.push(candidate)
      }
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Failed to add ICE candidate'),
      })
      throw error
    }
  }

  private async addBufferedCandidates(userId: string): Promise<void> {
    const connection = this.connections.get(userId)
    const candidates = this.iceCandidatesBuffer.get(userId) || []

    if (connection && connection.remoteDescription) {
      console.log(`📥 Добавление ${candidates.length} буферизованных ICE кандидатов для ${userId}`)

      try {
        await Promise.all(
          candidates.map((candidate) => connection.addIceCandidate(candidate)),
        )
        // Очищаем буфер после успешного добавления
        this.iceCandidatesBuffer.delete(userId)
      } catch (error) {
        this.emit('error', {
          userId,
          error: error instanceof Error ? error : new Error('Failed to add buffered ICE candidates'),
        })
      }
    }
  }

  isConnected(userId: string): boolean {
    const connection = this.connections.get(userId)
    return connection?.connectionState !== 'closed'
      && connection?.connectionState !== 'failed'
      && connection?.signalingState === 'stable'
  }

  close(userId: string): void {
    const connection = this.connections.get(userId)
    if (!connection) return

    try {
      // Просто очищаем sender'ы, не останавливая треки
      connection.getSenders().forEach((sender) => {
        try {
          connection.removeTrack(sender)
        } catch (e) {
          console.warn('Error removing track:', e)
        }
      })

      connection.close()
      this.connections.delete(userId)
      this.streams.delete(userId)
      this.iceCandidatesBuffer.delete(userId)
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Failed to close connection'),
      })
    }
  }

  destroy(): void {
    try {
      this.connections.forEach((_, userId) => this.close(userId))
      this.connections.clear()
      this.streams.clear()
      this.iceCandidatesBuffer.clear()
      this.removeAllListeners()
    } catch (error) {
      this.emit('error', {
        userId: 'global',
        error: error instanceof Error ? error : new Error('Failed to destroy manager'),
      })
    }
  }
}

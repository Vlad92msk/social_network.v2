import { EventEmitter } from 'events'

export class ConnectionManager extends EventEmitter {
  #initialized = false

  #configConnection: RTCConfiguration

  #peerConnections: Map<string, RTCPeerConnection> = new Map()

  #streamTypes: Map<string, Map<MediaStreamTrack, 'camera' | 'screen'>> = new Map()

  init(options: RTCConfiguration): void {
    if (this.#initialized) {
      this.destroy()
    }

    try {
      this.#configConnection = options
      this.#initialized = true
    } catch (error) {
      this.emit('error', new Error('Failed to initialize ConnectionManager'))
      throw error
    }
  }

  async createConnection(userId: string): Promise<RTCPeerConnection> {
    if (!this.#initialized) {
      throw new Error('ConnectionManager not initialized')
    }

    try {
      const pc = new RTCPeerConnection(this.#configConnection)

      // Создаем Map для хранения типов потоков этого пользователя
      this.#streamTypes.set(userId, new Map())

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('iceCandidate', { userId, candidate: event.candidate })
        }
      }

      pc.ontrack = (event) => {
        const trackType = this.#getTrackType(userId, event.track)
        this.emit('track', {
          userId,
          track: event.track,
          streams: event.streams,
          type: trackType,
        })
      }

      pc.onconnectionstatechange = () => {
        this.emit('connectionStateChanged', {
          userId,
          state: pc.connectionState,
        })

        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          this.closeConnection(userId)
        }
      }

      pc.onnegotiationneeded = async () => {
        this.emit('negotiationNeeded', { userId })
      }

      this.#peerConnections.set(userId, pc)
      return pc
    } catch (error) {
      this.emit('error', new Error(`Failed to create connection for user ${userId}`))
      throw error
    }
  }

  async addStream(
    userId: string,
    stream: MediaStream,
    type: 'camera' | 'screen',
  ): Promise<void> {
    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`)
    }

    try {
      const tracks = stream.getTracks()
      const userStreamTypes = this.#streamTypes.get(userId)!

      for (const track of tracks) {
        // Добавляем трек с определенными параметрами в зависимости от типа
        const transceiver = connection.addTransceiver(track, {
          streams: [stream],
          direction: 'sendonly',
          sendEncodings: type === 'screen' ? [
            {
              maxBitrate: 2500000, // Повышенный битрейт для скриншеринга
              maxFramerate: 30,
            },
          ] : [
            {
              maxBitrate: 1000000, // Стандартный битрейт для камеры
              maxFramerate: 30,
            },
          ],
        })

        // Сохраняем тип потока
        userStreamTypes.set(track, type)

        // Устанавливаем обработчик окончания трека
        track.onended = () => {
          userStreamTypes.delete(track)
          this.emit('trackEnded', { userId, track, type })
        }
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to add stream for user ${userId}`))
      throw error
    }
  }

  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`)
    }

    try {
      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)
      return offer
    } catch (error) {
      this.emit('error', new Error(`Failed to create offer for user ${userId}`))
      throw error
    }
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`)
    }

    try {
      await connection.setRemoteDescription(answer)
    } catch (error) {
      this.emit('error', new Error(`Failed to handle answer for user ${userId}`))
      throw error
    }
  }

  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`)
    }

    try {
      await connection.setRemoteDescription(offer)
      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)
      return answer
    } catch (error) {
      this.emit('error', new Error(`Failed to handle offer for user ${userId}`))
      throw error
    }
  }

  async addIceCandidate(userId: string, candidate: RTCIceCandidate): Promise<void> {
    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`)
    }

    try {
      await connection.addIceCandidate(candidate)
    } catch (error) {
      this.emit('error', new Error(`Failed to add ICE candidate for user ${userId}`))
      throw error
    }
  }

  async removeStream(userId: string, stream: MediaStream): Promise<void> {
    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`)
    }

    try {
      const tracks = stream.getTracks()
      const senders = connection.getSenders()
      const userStreamTypes = this.#streamTypes.get(userId)

      for (const track of tracks) {
        const sender = senders.find((s) => s.track === track)
        if (sender) {
          await connection.removeTrack(sender)
          if (userStreamTypes) {
            userStreamTypes.delete(track)
          }
        }
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to remove stream for user ${userId}`))
      throw error
    }
  }

  #getTrackType(userId: string, track: MediaStreamTrack): 'camera' | 'screen' | undefined {
    return this.#streamTypes.get(userId)?.get(track)
  }

  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.#peerConnections.get(userId)
  }

  getAllConnections(): Map<string, RTCPeerConnection> {
    return new Map(this.#peerConnections)
  }

  closeConnection(userId: string): void {
    const connection = this.#peerConnections.get(userId)
    if (connection) {
      try {
        connection.getSenders().forEach((sender) => {
          if (sender.track) {
            sender.track.stop()
          }
        })

        connection.close()
        this.#peerConnections.delete(userId)
        this.#streamTypes.delete(userId)
        this.emit('connectionClosed', { userId })
      } catch (error) {
        this.emit('error', new Error(`Failed to close connection for user ${userId}`))
      }
    }
  }

  destroy(): void {
    if (this.#initialized) {
      Array.from(this.#peerConnections.keys()).forEach((userId) => {
        this.closeConnection(userId)
      })

      this.#peerConnections.clear()
      this.#streamTypes.clear()
      this.removeAllListeners()
      this.#initialized = false
      this.emit('destroyed')
    }
  }
}

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

  private isConnectionActive(userId: string): boolean {
    const pc = this.#peerConnections.get(userId)
    return pc?.connectionState !== 'closed' && pc?.connectionState !== 'failed'
  }

  async createConnection(userId: string): Promise<RTCPeerConnection> {
    if (!this.#initialized) {
      throw new Error('ConnectionManager not initialized')
    }

    try {
      console.log('Creating new connection for user:', userId)
      const pc = new RTCPeerConnection(this.#configConnection)

      pc.onicecandidate = (event) => {
        console.log('ICE candidate event:', {
          userId,
          hasCandidate: !!event.candidate,
          candidateType: event.candidate?.type,
          connectionState: pc.connectionState,
          iceGatheringState: pc.iceGatheringState,
        })

        if (event.candidate) {
          this.emit('iceCandidate', { userId, candidate: event.candidate })
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state changed:', {
          userId,
          state: pc.iceConnectionState,
          connectionState: pc.connectionState,
          iceGatheringState: pc.iceGatheringState,
        })

        this.emit('iceConnectionStateChanged', {
          userId,
          state: pc.iceConnectionState,
        })

        if (pc.iceConnectionState === 'failed') {
          pc.restartIce()
          this.emit('iceRestart', { userId })
        }
      }

      pc.ontrack = (event) => {
        const trackType = event.transceiver?.sender?.track?.kind === 'video'
          ? (event.streams[0]?.getTracks().length > 1 ? 'screen' : 'camera')
          : 'audio'

        this.emit('track', {
          userId,
          track: event.track,
          streams: event.streams,
          type: trackType,
          transceiver: event.transceiver,
        })

        event.track.onended = () => {
          this.emit('trackEnded', {
            userId,
            track: event.track,
            type: trackType,
          })
        }
      }

      pc.onconnectionstatechange = () => {
        console.log('Connection state changed:', pc.connectionState)
        this.emit('connectionStateChanged', {
          userId,
          state: pc.connectionState,
        })

        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          this.closeConnection(userId)
        }
      }

      pc.onnegotiationneeded = () => {
        console.log('Negotiation needed for user:', userId)
        this.handleNegotiationNeeded(userId)
      }

      this.#streamTypes.set(userId, new Map())
      this.#peerConnections.set(userId, pc)
      return pc
    } catch (error) {
      console.error('Error creating connection:', error)
      this.emit('error', new Error(`Failed to create connection for user ${userId}`))
      throw error
    }
  }

  async handleNegotiationNeeded(userId: string): Promise<void> {
    const pc = this.#peerConnections.get(userId)
    if (!pc) return

    try {
      const offer = await this.createOffer(userId)
      this.emit('offerCreated', { userId, offer })
    } catch (error) {
      console.error('Negotiation failed:', error)
      this.emit('error', new Error(`Negotiation failed for user ${userId}`))
    }
  }

  async addStream(
    userId: string,
    stream: MediaStream,
    type: 'camera' | 'screen',
  ): Promise<void> {
    if (!this.isConnectionActive(userId)) {
      throw new Error(`Connection is not active for user ${userId}`)
    }

    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`)
    }

    try {
      const tracks = stream.getTracks()
      const userStreamTypes = this.#streamTypes.get(userId)!

      for (const track of tracks) {
        connection.addTransceiver(track, {
          streams: [stream],
          direction: 'sendonly',
          sendEncodings: type === 'screen' ? [
            {
              maxBitrate: 2500000,
              maxFramerate: 30,
            },
          ] : [
            {
              maxBitrate: 1000000,
              maxFramerate: 30,
            },
          ],
        })

        userStreamTypes.set(track, type)

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

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.#peerConnections.get(userId);
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`);
    }

    try {
      console.log('Handling answer:', {
        userId,
        connectionState: connection.connectionState,
        signalingState: connection.signalingState,
        iceGatheringState: connection.iceGatheringState,
        hasRemoteDescription: !!connection.remoteDescription,
        answerType: answer.type,
      });

      // Проверяем текущее состояние
      if (connection.signalingState !== 'have-local-offer') {
        console.warn('Unexpected signaling state for handling answer:', {
          currentState: connection.signalingState,
          expectedState: 'have-local-offer'
        });
      }

      // Устанавливаем remote description
      await connection.setRemoteDescription(new RTCSessionDescription(answer));

      console.log('Remote description set successfully:', {
        newSignalingState: connection.signalingState,
        newIceGatheringState: connection.iceGatheringState
      });

    } catch (error) {
      console.error('Error in handleAnswer:', {
        error,
        connectionState: connection.connectionState,
        signalingState: connection.signalingState,
        iceGatheringState: connection.iceGatheringState
      });

      throw new Error(`Failed to handle answer for user ${userId}`);
    }
  }

  // Также модифицируем handleOffer для полноты картины
  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const connection = this.#peerConnections.get(userId);
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`);
    }

    try {
      console.log('Handling offer:', {
        userId,
        connectionState: connection.connectionState,
        signalingState: connection.signalingState,
        iceGatheringState: connection.iceGatheringState
      });

      await connection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Remote description (offer) set');

      const answer = await connection.createAnswer();
      console.log('Answer created');

      await connection.setLocalDescription(answer);
      console.log('Local description (answer) set');

      return answer;
    } catch (error) {
      console.error('Error in handleOffer:', error);
      throw new Error(`Failed to handle offer for user ${userId}`);
    }
  }

  // И createOffer тоже обновим
  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const connection = this.#peerConnections.get(userId);
    if (!connection) {
      throw new Error(`Connection not found for user ${userId}`);
    }

    try {
      console.log('Creating offer:', {
        userId,
        connectionState: connection.connectionState,
        signalingState: connection.signalingState,
        iceGatheringState: connection.iceGatheringState
      });

      const offer = await connection.createOffer();
      console.log('Offer created');

      await connection.setLocalDescription(offer);
      console.log('Local description set:', {
        signalingState: connection.signalingState,
        iceGatheringState: connection.iceGatheringState
      });

      return offer;
    } catch (error) {
      console.error('Error in createOffer:', error);
      throw new Error(`Failed to create offer for user ${userId}`);
    }
  }

  async addIceCandidate(userId: string, candidate: RTCIceCandidate): Promise<void> {
    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Не установлено соединение с пользователем ${userId}`)
    }

    try {
      await connection.addIceCandidate(candidate)
    } catch (error) {
      this.emit('error', new Error(`Ошибка добавления ICE candidate для пользователя ${userId}`))
      throw error
    }
  }

  async removeStream(userId: string, stream: MediaStream): Promise<void> {
    const connection = this.#peerConnections.get(userId)
    if (!connection) {
      throw new Error(`Не установлено соединение с пользователем  ${userId}`)
    }

    try {
      const tracks = stream.getTracks()
      const senders = connection.getSenders()
      const userStreamTypes = this.#streamTypes.get(userId)

      await Promise.all(tracks.map(async (track) => {
        const sender = senders.find((s) => s.track === track)
        if (sender) {
          connection.removeTrack(sender)
          if (userStreamTypes) {
            userStreamTypes.delete(track)
          }
        }
      }))
    } catch (error) {
      this.emit('error', new Error(`Failed to remove stream for user ${userId}`))
      throw error
    }
  }

  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.#peerConnections.get(userId)
  }

  getAllConnections(): Map<string, RTCPeerConnection> {
    return this.#peerConnections
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

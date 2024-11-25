import { EventEmitter } from 'events'

type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

interface PeerEvents {
  // Событие получения нового трека
  track: { userId: string; track: MediaStreamTrack; stream: MediaStream };
  // Событие окончания трека
  trackEnded: { userId: string; trackId: string };
  // Событие изменения состояния соединения
  connectionState: { userId: string; state: ConnectionState };
  // Событие получения ICE кандидата
  iceCandidate: { userId: string; candidate: RTCIceCandidate };
  // Событие ошибки
  error: { userId: string; error: Error };
}

export class ConnectionManager extends EventEmitter {
  private connections = new Map<string, RTCPeerConnection>()

  private config: RTCConfiguration

  // Инициализация менеджера
  async init(config: RTCConfiguration): Promise<void> {
    this.config = config
  }

  // Создание нового peer соединения
  async createConnection(userId: string): Promise<void> {
    try {
      // Закрываем существующее соединение если есть
      this.closeConnection(userId)

      const connection = new RTCPeerConnection(this.config)
console.log('___connection')
      // Обработка необходимости перепереговоров (при добавлении/удалении треков)
      connection.onnegotiationneeded = async () => {
        try {
          // Создаём и отправляем новый offer
          const offer = await connection.createOffer()
          await connection.setLocalDescription(offer)

          // Уведомляем внешний код о необходимости отправить offer
          this.emit('negotiationNeeded', {
            userId,
            offer: connection.localDescription,
          })
        } catch (error) {
          this.emit('error', {
            userId,
            error: error instanceof Error
              ? error
              : new Error('Ошибка создания offer при перепереговорах'),
          })
        }
      }

      // Обработка входящих треков
      connection.ontrack = ({ track, streams }) => {
        const stream = streams[0]
        if (!stream) {
          this.emit('error', {
            userId,
            error: new Error('Не получен медиа поток вместе с треком'),
          })
          return
        }

        console.log('Получен новый трек:', {
          userId,
          trackKind: track.kind,
          trackEnabled: track.enabled,
          streamId: stream.id
        });

        this.emit('track', { userId, track, stream })

        // Отслеживаем окончание трека
        track.onended = () => {
          this.emit('trackEnded', { userId, trackId: track.id })
        }
      }

      // Отслеживание состояния соединения
      connection.onconnectionstatechange = () => {
        const state = connection.connectionState as ConnectionState
        this.emit('connectionState', { userId, state })
      }

      // Обработка ICE кандидатов
      connection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          this.emit('iceCandidate', { userId, candidate })
        }
      }

      this.connections.set(userId, connection)
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка создания соединения'),
      })
      throw error
    }
  }

  // Добавление медиа трека в соединение
  async addTrack(userId: string, track: MediaStreamTrack, stream: MediaStream): Promise<void> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }

    try {
      connection.addTrack(track, stream)
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка добавления трека'),
      })
      throw error
    }
  }

  // Создание offer для установки соединения
  async createOffer(userId: string): Promise<RTCSessionDescriptionInit | undefined> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }

    try {
      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)
      return offer
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка создания offer'),
      })
      throw error
    }
  }

  // Обработка входящего offer
  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }

    try {
      await connection.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)
      return answer
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка обработки offer'),
      })
      throw error
    }
  }

  // Обработка входящего answer
  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit) {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }

    try {
      await connection.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка обработки answer'),
      })
      throw error
    }
  }

  // Добавление ICE кандидата
  async addIceCandidate(userId: string, candidate: RTCIceCandidate) {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }

    try {
      await connection.addIceCandidate(candidate)
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка добавления ICE кандидата'),
      })
      throw error
    }
  }

  // Проверка состояния соединения
  isConnected(userId: string) {
    const connection = this.connections.get(userId)
    return connection?.connectionState === 'connected'
  }

  // Получение списка отправляемых треков
  getSenders(userId: string): RTCRtpSender[] {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }
    return connection.getSenders()
  }

  // Получение списка принимаемых треков
  getReceivers(userId: string): RTCRtpReceiver[] {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }
    return connection.getReceivers()
  }

  // Удаление конкретного трека из соединения
  async removeTrack(userId: string, trackId: string): Promise<void> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }

    try {
      const sender = connection.getSenders().find((s) => s.track?.id === trackId)
      if (sender) {
        await connection.removeTrack(sender)
      }
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка удаления трека'),
      })
      throw error
    }
  }

  // Замена трека (полезно при переключении камер)
  async replaceTrack(userId: string, oldTrackId: string, newTrack: MediaStreamTrack): Promise<void> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }

    try {
      const sender = connection.getSenders().find((s) => s.track?.id === oldTrackId)
      if (sender) {
        await sender.replaceTrack(newTrack)
      } else {
        throw new Error('Не найден трек для замены')
      }
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка замены трека'),
      })
      throw error
    }
  }

  // Получение статистики соединения
  async getStats(userId: string): Promise<RTCStatsReport> {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }

    try {
      return await connection.getStats()
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка получения статистики'),
      })
      throw error
    }
  }

  // Проверка состояния сигнального процесса
  getSignalingState(userId: string): RTCSignalingState {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }
    return connection.signalingState
  }

  // Получение информации о состоянии ICE соединения
  getIceConnectionState(userId: string): RTCIceConnectionState {
    const connection = this.connections.get(userId)
    if (!connection) {
      throw new Error(`Не найдено соединение для пользователя ${userId}`)
    }
    return connection.iceConnectionState
  }

  // Проверка наличия соединения
  hasConnection(userId: string): boolean {
    return this.connections.has(userId)
  }

  getConnections() {
    return Array.from(this.connections.entries()).map(([userId, connection]) => ({
      userId,
      state: connection.connectionState as ConnectionState,
      senders: connection.getSenders().length,
      receivers: connection.getReceivers().length,
    }))
  }

  // Закрытие соединения с пользователем
  closeConnection(userId: string): void {
    const connection = this.connections.get(userId)
    if (!connection) return

    try {
      // Останавливаем все треки
      connection.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop()
      })

      connection.getReceivers().forEach((receiver) => {
        if (receiver.track) receiver.track.stop()
      })

      connection.close()
      this.connections.delete(userId)
    } catch (error) {
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка закрытия соединения'),
      })
    }
  }

  // Уничтожение менеджера
  destroy() {
    try {
      this.connections.forEach((_, userId) => this.closeConnection(userId))
      this.connections.clear()
      this.removeAllListeners()
    } catch (error) {
      this.emit('error', {
        userId: 'global',
        error: error instanceof Error ? error : new Error('Ошибка уничтожения менеджера'),
      })
    }
  }
}

import { EventEmitter } from 'events'

export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

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
      console.log(`[Connection] Создаем новое соединение для ${userId}`)

      const connection = new RTCPeerConnection(this.config)
      // Добавим проверку на дубликаты кандидатов
      const processedCandidates = new Set()

      // Проверим конфигурацию
      console.log('[Connection] ICE config:', this.config)

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

        this.emit('track', { userId, track, stream })

        // Отслеживаем окончание трека
        track.onended = () => {
          this.emit('trackEnded', { userId, trackId: track.id })
        }
      }

      connection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          // Создадим уникальный ключ для кандидата
          const candidateKey = candidate.candidate // используем строку кандидата как ключ

          if (!processedCandidates.has(candidateKey)) {
            processedCandidates.add(candidateKey)

            console.log(`[ICE] Новый кандидат для ${userId}:`, {
              foundation: candidate.foundation,
              protocol: candidate.protocol,
              type: candidate.type,
              candidate: candidate.candidate,
            })

            this.emit('iceCandidate', { userId, candidate })
          } else {
            console.log(`[ICE] Пропускаем дубликат кандидата для ${userId}`)
          }
        } else {
          console.log(`[ICE] Сбор кандидатов завершен для ${userId}`)
        }
      }

      connection.onconnectionstatechange = () => {
        console.log(`[Connection] Состояние соединения для ${userId}:`, {
          connectionState: connection.connectionState,
          iceConnectionState: connection.iceConnectionState,
          iceGatheringState: connection.iceGatheringState,
          signalingState: connection.signalingState,
        })
      }

      // Следим за состоянием ICE
      connection.oniceconnectionstatechange = () => {
        console.log(`[ICE] Состояние соединения для ${userId}:`, connection.iceConnectionState)
        this.emit('iceConnectionState', {
          userId,
          state: connection.iceConnectionState,
        })
      }

      this.connections.set(userId, connection)
      this.emit('connectionCreated', { userId })
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
      console.log('Remote Description установлен')

      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)
      console.log('Local Description установлен')

      return answer
    } catch (error) {
      console.error('[Connection] Ошибка в handleOffer:', error)
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
      if (!candidate || !candidate.candidate) {
        console.log(`[ICE] Пропускаем пустого кандидата для ${userId}`)
        return
      }

      await connection.addIceCandidate(candidate)
      console.log(`[ICE] Кандидат успешно добавлен для ${userId}`)
    } catch (error) {
      console.error(`[ICE] Ошибка добавления кандидата для ${userId}:`, error)
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
      sendersArr: connection.getSenders(),
    }))
  }

  // Закрытие соединения с пользователем
  closeConnection(userId: string): void {
    const connection = this.connections.get(userId)
    if (!connection) {
      console.warn(`Соединение для пользователя ${userId} не найдено при попытке закрытия.`)
      return
    }

    try {
      // Закрываем все отправляемые треки
      // connection.getSenders().forEach(sender => sender.track?.stop())
      connection.getSenders().forEach((sender) => {
        connection.removeTrack(sender)
      })
      // Закрываем соединение
      connection.close()

      // Удаляем из коллекции
      this.connections.delete(userId)
      console.log(`[Connection] Соединение с пользователем ${userId} успешно закрыто.`)
      this.emit('connectionClosed', { userId })
    } catch (error) {
      console.error(`[Connection] Ошибка закрытия соединения для ${userId}:`, error)
      this.emit('error', {
        userId,
        error: error instanceof Error ? error : new Error('Ошибка закрытия соединения'),
      })
    }
  }

  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.connections.get(userId)
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

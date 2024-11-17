import { EventEmitter } from 'events'

export interface Participant {
  userId: string
  streams: Set<MediaStream>
}

export interface RoomInfo {
  dialogId: string
  participants: string[]
  createdAt: string
}

/**
 * RoomService отвечает только за управление участниками и их медиа потоками
 */
export class RoomService extends EventEmitter {
  #room?: RoomInfo

  #participants = new Map<string, Participant>()

  /**
   * Инициализация комнаты
   */
  init(info: RoomInfo): void {
    this.#room = info
    this.#participants.clear()

    // Создаем начальных участников
    info.participants.forEach((userId) => {
      this.#participants.set(userId, {
        userId,
        streams: new Set(),
      })
    })

    this.emit('initialized', info)
  }

  /**
   * Добавление участника
   */
  addParticipant(userId: string): void {
    if (!this.#room) return
console.log('addParticipant', userId)
    // Добавляем только если участника еще нет
    if (!this.#participants.has(userId)) {
      this.#participants.set(userId, {
        userId,
        streams: new Set(),
      })

      this.#room.participants.push(userId)
      this.emit('participantAdded', { userId })
    }
  }

  /**
   * Удаление участника
   */
  removeParticipant(userId: string): void {
    if (!this.#room) return

    const participant = this.#participants.get(userId)
    if (!participant) return

    // Очищаем ресурсы участника
    participant.streams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop())
    })

    // Удаляем участника
    this.#participants.delete(userId)
    const index = this.#room.participants.indexOf(userId)
    if (index !== -1) {
      this.#room.participants.splice(index, 1)
    }

    this.emit('participantRemoved', { userId })
  }

  /**
   * Добавление медиа потока участнику
   */
  addStream(userId: string, stream: MediaStream): void {
    const participant = this.#participants.get(userId)
    if (!participant) return

    // Добавляем поток если его еще нет
    if (!participant.streams.has(stream)) {
      participant.streams.add(stream)
      this.emit('streamAdded', { userId, stream })
    }
  }

  /**
   * Удаление медиа потока у участника
   */
  removeStream(userId: string, streamId: string): void {
    const participant = this.#participants.get(userId)
    if (!participant) return

    // Находим и удаляем поток
    participant.streams.forEach((stream) => {
      if (stream.id === streamId) {
        stream.getTracks().forEach((track) => track.stop())
        participant.streams.delete(stream)
        this.emit('streamRemoved', { userId, streamId })
      }
    })
  }

  /**
   * Получение участника
   */
  getParticipant(userId: string): Participant | undefined {
    return this.#participants.get(userId)
  }

  /**
   * Получение всех участников
   */
  getParticipants(): Participant[] {
    return Array.from(this.#participants.values())
  }

  /**
   * Получение активных медиа потоков
   */
  getStreams(): Array<{ userId: string, streams: MediaStream[] }> {
    const result: Array<{ userId: string, streams: MediaStream[] }> = []

    this.#participants.forEach((participant, userId) => {
      if (participant.streams.size > 0) {
        result.push({
          userId,
          streams: Array.from(participant.streams),
        })
      }
    })

    return result
  }

  getRoomInfo(): RoomInfo | undefined {
    return this.#room
  }

  getParticipantCount(): number {
    return this.#participants.size
  }

  hasParticipant(userId: string): boolean {
    return this.#participants.has(userId)
  }

  getParticipantTracks(userId: string, kind?: 'audio' | 'video'): MediaStreamTrack[] {
    const participant = this.#participants.get(userId)
    if (!participant) return []

    const tracks: MediaStreamTrack[] = []
    participant.streams.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        if (!kind || track.kind === kind) {
          tracks.push(track)
        }
      })
    })
    return tracks
  }

  muteParticipantAudio(userId: string): void {
    const audioTracks = this.getParticipantTracks(userId, 'audio')
    audioTracks.forEach((track) => track.enabled = false)
    this.emit('participantAudioMuted', { userId })
  }

  unmuteParticipantAudio(userId: string): void {
    const audioTracks = this.getParticipantTracks(userId, 'audio')
    audioTracks.forEach((track) => track.enabled = true)
    this.emit('participantAudioUnmuted', { userId })
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    // Останавливаем все медиа потоки
    this.#participants.forEach((participant) => {
      participant.streams.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop())
      })
    })

    // Очищаем данные
    this.#participants.clear()
    this.#room = undefined
    this.removeAllListeners()
  }
}

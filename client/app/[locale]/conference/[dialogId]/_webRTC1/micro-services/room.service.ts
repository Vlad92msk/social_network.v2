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

    console.log('➕ Добавление участника:', userId)

    // Добавляем только если участника еще нет
    if (!this.#participants.has(userId)) {
      this.#participants.set(userId, {
        userId,
        streams: new Set<MediaStream>(),
      })

      this.#room.participants.push(userId)
      console.log('✅ Участник добавлен:', userId)
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
    console.log(`➕ Попытка добавить поток ${stream.id} для пользователя ${userId}`);

    const participant = this.#participants.get(userId);
    if (!participant) {
      console.warn(`⚠️ Участник ${userId} не найден при добавлении потока`);
      return;
    }

    // Проверяем наличие треков в потоке
    const tracks = stream.getTracks();
    console.log(`📊 Поток содержит ${tracks.length} треков:`,
      tracks.map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled, muted: t.muted }))
    );

    // Добавляем поток и проверяем успешность
    const sizeBefore = participant.streams.size;
    participant.streams.add(stream);
    const sizeAfter = participant.streams.size;

    if (sizeAfter > sizeBefore) {
      console.log(`✅ Поток ${stream.id} успешно добавлен к участнику ${userId}`);
      this.emit('streamAdded', { userId, stream });
    } else {
      console.log(`ℹ️ Поток ${stream.id} уже существует у участника ${userId}`);
    }
  }

  /**
   * Удаление медиа потока у участника
   */
  removeStream(userId: string, streamId: string): void {
    console.log(`➖ Попытка удалить поток ${streamId} у участника ${userId}`)

    const participant = this.#participants.get(userId)
    if (!participant) {
      console.warn(`⚠️ Участник ${userId} не найден при удалении потока`)
      return
    }

    // Находим и удаляем поток
    participant.streams.forEach((stream) => {
      if (stream.id === streamId) {
        stream.getTracks().forEach((track) => track.stop())
        participant.streams.delete(stream)
        console.log(`✅ Поток ${streamId} удален у участника ${userId}`)
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

import { EventEmitter } from 'events'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

export interface Participant {
  userId: string
  streams: Set<MediaStream>
  userInfo: UserInfo
  mickActive: boolean
  videoActive?: boolean
  streamsType: Record<string, 'camera' | 'screen'>
}

interface RoomParticipant {
  userId: string;
  joinedAt: Date;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  userInfo: UserInfo
  mickActive: boolean
  videoActive?: boolean
  streamsType: Record<string, 'camera' | 'screen'>
}
export interface RoomInfo {
  dialogId: string
  participants: RoomParticipant[]
  createdAt: string
  currentUser: UserInfo
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

    console.log('info', info)
    // Создаем начальных участников
    info.participants.forEach((user) => {
      this.#participants.set(user.userId, {
        userId: user.userId,
        streams: new Set(),
        userInfo: user.userInfo,
        mickActive: user.mickActive,
        videoActive: user.videoActive,
        streamsType: user.streamsType,
      })
    })
    this.emit('initialized', info)
  }

  /**
   * Добавление участника
   */
  addParticipant(user: UserInfo): void {
    if (!this.#room) return

    console.log('➕ Добавление участника:', user.id)

    // Добавляем только если участника еще нет
    if (!this.#participants.has(String(user.id))) {
      this.#participants.set(String(user.id), {
        userId: String(user.id),
        streams: new Set<MediaStream>(),
        userInfo: user,
        mickActive: false,
        streamsType: {},
      })

      console.log('✅ Участник добавлен:', String(user.id))
      this.emit('participantAdded', { user })
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

    this.emit('participantRemoved', { user: participant.userInfo })

    // Удаляем участника
    this.#participants.delete(userId)
  }

  /**
   * Добавление медиа потока участнику
   */
  addStream(userId: string, stream: MediaStream): void {
    console.log(`➕ Попытка добавить поток ${stream.id} для пользователя ${userId}`)

    const participant = this.#participants.get(userId)
    if (!participant) {
      console.warn(`⚠️ Участник ${userId} не найден при добавлении потока`)
      return
    }

    // Проверяем наличие треков в потоке
    const tracks = stream.getTracks()
    console.log(
      `📊 Поток содержит ${tracks.length} треков:`,
      tracks.map((t) => ({ kind: t.kind, id: t.id, enabled: t.enabled, muted: t.muted })),
    )

    // Добавляем поток и проверяем успешность
    const sizeBefore = participant.streams.size
    participant.streams.add(stream)
    const sizeAfter = participant.streams.size

    if (sizeAfter > sizeBefore) {
      console.log(`✅ Поток ${stream.id} успешно добавлен к участнику ${userId}`)
      this.emit('streamAdded', { userId, stream })
    } else {
      console.log(`ℹ️ Поток ${stream.id} уже существует у участника ${userId}`)
    }
  }

  onCameraOff(userId: string) {
    const participant = this.#participants.get(userId)
    if (!participant) {
      console.warn(`⚠️ Участник ${userId} не найден при удалении потока`)
      return
    }

    const p = this.getParticipant(userId)
    if (p) {
      this.#participants.set(userId, {
        ...p,
        videoActive: false,
      })
    }
    this.emit('onCameraOff')
  }

  /**
   * Удаление медиа потока у участника
   */
  removeStream(userId: string, streamId: string) {
    console.log(`➖ Попытка удалить поток ${streamId} у участника ${userId}`)

    const participant = this.#participants.get(userId)
    if (!participant) {
      console.warn(`⚠️ Участник ${userId} не найден при удалении потока`)
      return
    }

    const p = this.getParticipant(userId)
    if (p) {
      this.#participants.set(userId, {
        ...p,
        videoActive: false,
      })
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

  getCurrentUser() {
    return this.#room?.currentUser
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
    const p = this.getParticipant(userId)
    if (p) {
      this.#participants.set(userId, { ...p, mickActive: false })
    }
    const audioTracks = this.getParticipantTracks(userId, 'audio')
    audioTracks.forEach((track) => track.enabled = false)
    this.emit('participantAudioMuted', { userId })
  }

  unmuteParticipantAudio(userId: string): void {
    const p = this.getParticipant(userId)
    if (p) {
      this.#participants.set(userId, { ...p, mickActive: true })
    }
    const audioTracks = this.getParticipantTracks(userId, 'audio')
    audioTracks.forEach((track) => track.enabled = true)
    this.emit('participantAudioUnmuted', { userId })
  }

  setStreamType(userId: string, streamId: string, type: 'camera' | 'screen') {
    const p = this.getParticipant(userId)
    if (p) {
      if (type === 'camera') {
        this.#participants.set(userId, {
          ...p,
          videoActive: type === 'camera',
          streamsType: {
            ...p.streamsType,
            [streamId]: type,
          },
        })
      }

      if (type === 'screen') {
        this.#participants.set(userId, {
          ...p,
          streamsType: {
            ...p.streamsType,
            [streamId]: type,
          },
        })
      }
    }
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

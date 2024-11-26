import { EventEmitter } from 'events'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

interface ParticipantMedia {
  hasAudio: boolean
  hasVideo: boolean
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  streams: {
    camera?: MediaStream
    screen?: MediaStream
  }
}

interface Participant {
  userId: string
  userInfo: UserInfo
  media: ParticipantMedia
  joinedAt: Date
}

export interface RoomInfo {
  roomId: string
  createdAt: string
  currentUser: UserInfo
  participants: Array<{
    userId: string
    userInfo: UserInfo
    joinedAt: Date
  }>
}

export class RoomService extends EventEmitter {
  private room?: RoomInfo

  private participants = new Map<string, Participant>()

  /**
   * Инициализация комнаты
   */
  init(info: RoomInfo): void {
    this.room = info
    this.participants.clear()

    // Инициализируем начальных участников
    info.participants.forEach((user) => {
      this.participants.set(user.userId, {
        userId: user.userId,
        userInfo: user.userInfo,
        joinedAt: user.joinedAt,
        media: {
          hasAudio: false,
          hasVideo: false,
          isAudioEnabled: false,
          isVideoEnabled: false,
          isScreenSharing: false,
          streams: {},
        },
      })
    })

    this.emit('initialized', this.getState())
  }

  /**
   * Добавление нового участника
   */
  addParticipant(userInfo: UserInfo): void {
    const userId = String(userInfo.id)

    if (!this.participants.has(userId)) {
      this.participants.set(userId, {
        userId,
        userInfo,
        joinedAt: new Date(),
        media: {
          hasAudio: false,
          hasVideo: false,
          isAudioEnabled: false,
          isVideoEnabled: false,
          isScreenSharing: false,
          streams: {},
        },
      })

      this.emit('participantJoined', { userId, userInfo })
      this.emit('stateChanged', this.getState())
    }
  }

  /**
   * Удаление участника
   */
  removeParticipant(userId: string): void {
    if (this.participants.delete(userId)) {
      this.emit('participantLeft', { userId })
      this.emit('stateChanged', this.getState())
    }
  }

  /**
   * Обновление состояния медиа участника
   */
  updateParticipantMedia(userId: string, updates: Partial<ParticipantMedia>): void {
    const participant = this.participants.get(userId)
    if (participant) {
      participant.media = {
        ...participant.media,
        ...updates,
      }

      this.emit('participantMediaChanged', {
        userId,
        media: participant.media,
      })
      this.emit('stateChanged', this.getState())
    }
  }

  /**
   * Добавление медиапотока участнику
   */
  addStream(userId: string, stream: MediaStream, type: 'camera' | 'screen'): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    // Определяем тип медиа на основе треков
    const hasVideo = stream.getVideoTracks().length > 0
    const hasAudio = stream.getAudioTracks().length > 0

    // Обновляем состояние медиа участника
    participant.media = {
      ...participant.media,
      hasVideo: hasVideo || participant.media.hasVideo,
      hasAudio: hasAudio || participant.media.hasAudio,
      streams: {
        ...participant.media.streams,
        [type]: stream,
      },
    }

    // Слушаем состояние треков
    stream.getTracks().forEach(track => {
      track.onmute = () => this.emit('stateChanged', this.getState());
      track.onunmute = () => this.emit('stateChanged', this.getState());
      track.onended = () => this.emit('stateChanged', this.getState());
    });
    this.emit('streamAdded', { userId, stream, type })
    this.emit('stateChanged', this.getState())
  }

  /**
   * Удаление медиапотока участника
   */
  removeStream(userId: string, type: 'camera' | 'screen'): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    const stream = participant.media.streams[type]
    if (stream) {
      // Создаем новый объект streams без удаляемого потока
      const newStreams = { ...participant.media.streams }
      delete newStreams[type]

      // Проверяем остались ли еще треки в других потоках
      const remainingStreams = Object.values(newStreams).filter((s): s is MediaStream => s !== undefined)

      const hasOtherVideo = remainingStreams
        .some((s) => s.getVideoTracks().length > 0)
      const hasOtherAudio = remainingStreams
        .some((s) => s.getAudioTracks().length > 0)

      participant.media = {
        ...participant.media,
        hasVideo: hasOtherVideo,
        hasAudio: hasOtherAudio,
        streams: newStreams,
      }

      this.emit('streamRemoved', { userId, type })
      this.emit('stateChanged', this.getState())
    }
  }

  /**
   * Получение информации об участнике
   */
  getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId)
  }

  /**
   * Получение списка всех участников
   */
  getParticipants(): Participant[] {
    return Array.from(this.participants.values())
  }

  /**
   * Получение текущего пользователя
   */
  getCurrentUser(): UserInfo | undefined {
    return this.room?.currentUser
  }

  /**
   * Получение полного состояния комнаты
   */
  getState() {
    return {
      roomId: this.room?.roomId,
      currentUser: this.room?.currentUser,
      participants: this.getParticipants(),
    }
  }

  /**
   * Очистка
   */
  destroy(): void {
    this.participants.clear()
    this.room = undefined
    this.removeAllListeners()
    this.emit('destroyed')
  }
}

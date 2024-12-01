import { EventEmitter } from 'events'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

interface ParticipantMedia {
  hasAudio: boolean // Есть ли аудио трек
  hasVideo: boolean // Есть ли видео трек с камеры
  isAudioEnabled: boolean // Включен ли аудио трек
  isVideoEnabled: boolean // Включен ли видео трек
  isScreenSharing: boolean // Есть ли активный трек трансляции экрана
  stream?: MediaStream // Единый поток для всех треков
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
          stream: undefined,
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
          stream: undefined,
        },
      })

      this.emit('participantJoined', { userId, userInfo })
      this.emit('stateChanged', this.getState())
    }
  }

  handleTrackDisabled(userId: string, track: MediaStreamTrack): void {
    const updates: Partial<ParticipantMedia> = {}

    if (track.kind === 'audio') {
      updates.isAudioEnabled = false
    } else if (track.kind === 'video') {
      updates.isVideoEnabled = false
    }

    this.updateParticipantMedia(userId, updates)
  }

  handleTrackEnabled(userId: string, track: MediaStreamTrack): void {
    const updates: Partial<ParticipantMedia> = {}

    if (track.kind === 'audio') {
      updates.isAudioEnabled = true
    } else if (track.kind === 'video') {
      updates.isVideoEnabled = true
    }

    this.updateParticipantMedia(userId, updates)
  }

  handleTrackEnded(userId: string, track: MediaStreamTrack): void {
    const participant = this.participants.get(userId)
    if (!participant || !participant.media.stream) return

    const updates: Partial<ParticipantMedia> = {}

    if (track.kind === 'audio') {
      updates.hasAudio = false
      updates.isAudioEnabled = false
    } else if (track.kind === 'video') {
      updates.hasVideo = false
      updates.isVideoEnabled = false
    }

    // Сначала обновляем состояние
    this.updateParticipantMedia(userId, updates)

    // Потом удаляем трек
    participant.media.stream.removeTrack(track)
  }

  /**
   * Удаление участника
   */
  removeParticipant(userId: string): void {
    const participant = this.participants.get(userId)
    if (participant) {
      if (participant.media.stream) {
        participant.media.stream.getTracks().forEach((track) => track.stop())
      }
      this.participants.delete(userId)
      this.emit('participantLeft', { userId })
      this.emit('stateChanged', this.getState())
    }
  }

  handleTrack(userId: string, track: MediaStreamTrack): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    // Создаем новый MediaStream если его еще нет
    if (!participant.media.stream) {
      participant.media.stream = new MediaStream()
    }

    // Добавляем новый трек в существующий стрим
    participant.media.stream.addTrack(track)

    const updates: Partial<ParticipantMedia> = {
      stream: participant.media.stream,
    }

    if (track.kind === 'audio') {
      updates.hasAudio = true
      updates.isAudioEnabled = track.enabled
    } else if (track.kind === 'video') {
      updates.hasVideo = true
      updates.isVideoEnabled = track.enabled
    }

    this.updateParticipantMedia(userId, updates)
  }

  /**
   * Обновление состояния медиа участника
   */
  updateParticipantMedia(userId: string, updates: Partial<ParticipantMedia>): void {
    const participant = this.participants.get(userId)
    if (participant) {
      // Проверяем, есть ли реальные изменения
      const hasChanges = Object.entries(updates).some(([key, value]) => participant.media[key as keyof ParticipantMedia] !== value)

      if (!hasChanges) {
        return // Пропускаем обновление если ничего не изменилось
      }

      // Обновляем состояние треков в MediaStream
      if (participant.media.stream) {
        const tracks = participant.media.stream.getTracks()

        if ('isAudioEnabled' in updates) {
          const audioTrack = tracks.find((track) => track.kind === 'audio')
          if (audioTrack && audioTrack.enabled !== updates.isAudioEnabled) {
            audioTrack.enabled = updates.isAudioEnabled!
          }
        }

        if ('isVideoEnabled' in updates) {
          const videoTrack = tracks.find((track) => track.kind === 'video')
          if (videoTrack && videoTrack.enabled !== updates.isVideoEnabled) {
            videoTrack.enabled = updates.isVideoEnabled!
          }
        }
      }

      // Обновляем состояние в сторе
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
    this.participants.forEach((participant) => {
      if (participant.media.stream) {
        participant.media.stream.getTracks().forEach((track) => track.stop())
      }
    })
    this.participants.clear()
    this.room = undefined
    this.removeAllListeners()
    this.emit('destroyed')
  }
}

import { EventEmitter } from 'events'
import * as stream from 'node:stream'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

interface ParticipantMedia {
  hasAudio: boolean // Есть ли аудио трек
  hasVideo: boolean // Есть ли видео трек с камеры
  isAudioEnabled: boolean // Включен ли аудио трек
  isVideoEnabled: boolean // Включен ли видео трек
  isScreenSharing: boolean // Есть ли активный трек трансляции экрана
  streams: Map<string, MediaStream> // Храним все стримы по их ID
  screenStreamId?: string
  cameraStreamId?: string
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
          streams: new Map(),
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
          streams: new Map(),
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

  /**
   * Удаление участника
   */
  removeParticipant(userId: string): void {
    const participant = this.participants.get(userId)
    if (participant) {
      // Останавливаем треки во всех потоках
      if (participant.media.streams) {
        participant.media.streams.forEach((stream) => {
          stream.getTracks().forEach((track) => track.stop())
        })
      }
      this.participants.delete(userId)
      this.emit('participantLeft', { userId })
      this.emit('stateChanged', this.getState())
    }
  }

  handleTrack(userId: string, track: MediaStreamTrack, stream: MediaStream): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    if (!participant.media.streams) {
      participant.media.streams = new Map()
    }

    // Получаем существующий поток или создаем новый
    let currentStream = participant.media.streams.get(stream.id)
    if (!currentStream) {
      currentStream = new MediaStream()
      participant.media.streams.set(stream.id, currentStream)
    }

    // Добавляем трек, если его еще нет в потоке
    if (!currentStream.getTracks().some(t => t.id === track.id)) {
      currentStream.addTrack(track)
    }

    const updates: Partial<ParticipantMedia> = {
      streams: participant.media.streams,
    }

    // Определяем тип потока по ID
    const isScreenShare = stream.id === participant.media.screenStreamId
    const isCamera = stream.id === participant.media.cameraStreamId

    if (track.kind === 'audio') {
      updates.hasAudio = true
      updates.isAudioEnabled = track.enabled
    } else if (track.kind === 'video') {
      if (isScreenShare) {
        updates.isScreenSharing = true
      } else if (isCamera) {
        updates.hasVideo = true
        updates.isVideoEnabled = track.enabled
      }
    }

    this.updateParticipantMedia(userId, updates)
  }

  handleTrackEnded(userId: string, track: MediaStreamTrack, stream: MediaStream): void {
    const participant = this.participants.get(userId)
    if (!participant || !participant.media.streams) return

    // Проверяем, является ли это треком трансляции экрана
    const isScreenShare = stream.id === participant.media.screenStreamId

    // Удаляем трек из потока
    stream.removeTrack(track)
    track.stop()

    // Если это трансляция экрана или в потоке не осталось треков - удаляем его
    if (isScreenShare || stream.getTracks().length === 0) {
      participant.media.streams.delete(stream.id)
    }

    const updates: Partial<ParticipantMedia> = {}
    if (isScreenShare) {
      updates.isScreenSharing = false
      updates.screenStreamId = undefined
    } else if (track.kind === 'audio') {
      updates.hasAudio = false
      updates.isAudioEnabled = false
    } else if (track.kind === 'video') {
      updates.hasVideo = false
      updates.isVideoEnabled = false
    }

    this.updateParticipantMedia(userId, updates)
  }

  /**
   * Обновление состояния медиа участника
   */
  updateParticipantMedia(userId: string, updates: Partial<ParticipantMedia>): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    // Проверяем изменения, исключая streams
    const hasChanges = Object.entries(updates).some(([key, value]) => {
      if (key === 'streams') return false
      return participant.media[key as keyof ParticipantMedia] !== value
    })

    if (!hasChanges) return

    if (participant.media.streams) {

      if ('isScreenSharing' in updates) {
        const {isScreenSharing} = updates
        if (isScreenSharing === false) {
          // @ts-ignore
          participant.media.streams.delete(!participant.media.screenStreamId!)
        }
      }

      participant.media.streams.forEach((stream) => {
        const tracks = stream.getTracks()
        const isScreenShare = stream.id === participant.media.screenStreamId
        const isCamera = stream.id === participant.media.cameraStreamId

        if ('isAudioEnabled' in updates) {
          const audioTrack = tracks.find((track) => track.kind === 'audio')
          if (audioTrack && audioTrack.enabled !== updates.isAudioEnabled) {
            audioTrack.enabled = updates.isAudioEnabled!
          }
        }

        if ('isVideoEnabled' in updates && isCamera) {
          const videoTrack = tracks.find((track) => track.kind === 'video')
          if (videoTrack && videoTrack.enabled !== updates.isVideoEnabled) {
            videoTrack.enabled = updates.isVideoEnabled!
          }
        }

        if ('isScreenSharing' in updates && isScreenShare) {
          const videoTrack = tracks.find((track) => track.kind === 'video')
          if (videoTrack) {
            videoTrack.enabled = updates.isScreenSharing!
          }
        }
      })
    }

    participant.media = {
      ...participant.media,
      ...updates,
      streams: updates.streams || participant.media.streams,
    }



    this.emit('participantMediaChanged', { userId, media: participant.media })
    this.emit('stateChanged', this.getState())
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
      // Останавливаем треки во всех потоках
      if (participant.media.streams) {
        participant.media.streams.forEach((stream) => {
          stream.getTracks().forEach((track) => track.stop())
        })
      }
    })
    this.participants.clear()
    this.room = undefined
    this.removeAllListeners()
    this.emit('destroyed')
  }
}

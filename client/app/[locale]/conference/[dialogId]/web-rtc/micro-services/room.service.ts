import { EventEmitter } from 'events'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

interface ParticipantMedia {
  hasAudio: boolean;
  hasVideo: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  streams: Record<string, MediaStream>;
  screenStreamId?: string;
  cameraStreamId?: string;
}

export interface Participant {
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
   * Обработка входящего трека
   */
  handleTrack(userId: string, track: MediaStreamTrack, stream: MediaStream): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    // Используем ID оригинального потока как ключ
    const streamId = stream.id

    // Создаем/получаем поток
    if (!participant.media.streams[streamId]) {
      participant.media.streams[streamId] = new MediaStream()
    }

    const currentStream = participant.media.streams[streamId]

    // Добавляем трек (без проверки на существование, т.к. handleTrack
    // вызывается только для новых треков)
    currentStream.addTrack(track)

    // Обновляем маппинг ID потока
    if (track.kind === 'video' && !participant.media.screenStreamId) {
      participant.media.cameraStreamId = streamId
    } else if (track.kind === 'video' && participant.media.screenStreamId) {
      participant.media.screenStreamId = streamId
    }

    // Обновляем состояние медиа
    if (track.kind === 'audio') {
      participant.media.hasAudio = true
      participant.media.isAudioEnabled = track.enabled
    } else if (track.kind === 'video') {
      participant.media.hasVideo = true
      participant.media.isVideoEnabled = track.enabled
    }

    this.emitStateChanged()
  }

  /**
   * Инициализация состояния участника
   */
  handleInitialSetup(userId: string, setup: any): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    participant.media = {
      ...participant.media,
      ...setup,
      // Сохраняем существующие потоки!
      streams: participant.media.streams,
    }

    this.emitStateChanged()
  }

  handleVideoState(userId: string, enabled: boolean): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    participant.media.isVideoEnabled = enabled

    // Применяем состояние к треку, если он есть
    if (participant.media.cameraStreamId) {
      const stream = participant.media.streams[participant.media.cameraStreamId]
      stream?.getVideoTracks().forEach(track => {
        track.enabled = enabled
      })
    }

    this.emitStateChanged()
  }

  handleAudioState(userId: string, enabled: boolean): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    participant.media.isAudioEnabled = enabled

    // Применяем состояние к треку, если он есть
    if (participant.media.cameraStreamId) {
      const stream = participant.media.streams[participant.media.cameraStreamId]
      stream?.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
    }

    this.emitStateChanged()
  }

  /**
   * Инициализация камеры
   */
  handleCameraStart(userId: string, streamId: string): void {
    console.log('Handle Camera Start:', { userId, streamId })

    const participant = this.participants.get(userId)
    if (!participant) return

    participant.media.cameraStreamId = streamId
    participant.media.isVideoEnabled = true

    // Не создаем пустой поток, он будет создан когда придет трек
    this.emitStateChanged()
  }

  /**
   * Управление трансляцией экрана
   */
  handleScreenShare(userId: string, enabled: boolean, streamId?: string): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    if (enabled && streamId) {
      participant.media.screenStreamId = streamId
      participant.media.isScreenSharing = true
    } else {
      // Удаляем поток трансляции
      if (participant.media.screenStreamId) {
        const stream = participant.media.streams[participant.media.screenStreamId]
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
          delete participant.media.streams[participant.media.screenStreamId]
        }
      }
      participant.media.screenStreamId = undefined
      participant.media.isScreenSharing = false
    }

    this.emitStateChanged()
  }

  /**
   * Обработка завершения трека
   */
  handleTrackEnded(userId: string, track: MediaStreamTrack, stream: MediaStream): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    const currentStream = participant.media.streams[stream.id]
    if (!currentStream) return

    // Удаляем трек из потока
    currentStream.removeTrack(track)
    track.stop()

    // Если поток пустой - удаляем его
    if (currentStream.getTracks().length === 0) {
      delete participant.media.streams[stream.id]
    }

    const updates: Partial<ParticipantMedia> = {
      streams: participant.media.streams,
    }

    // Обновляем состояние в зависимости от типа трека
    if (stream.id === participant.media.screenStreamId) {
      updates.isScreenSharing = false
      updates.screenStreamId = undefined
    } else if (track.kind === 'audio') {
      updates.hasAudio = false
      updates.isAudioEnabled = false
    } else if (track.kind === 'video') {
      updates.hasVideo = false
      updates.isVideoEnabled = false
    }

    this.updateMediaState(userId, updates)
  }

  /**
   * Обновление состояния медиа
   */
  private updateMediaState(userId: string, updates: Partial<ParticipantMedia>): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    // Сохраняем существующие потоки если новые не предоставлены
    const updatedStreams = updates.streams || participant.media.streams

    // Применяем обновления к существующим трекам
    Object.entries(updatedStreams).forEach(([streamId, stream]) => {
      const tracks = stream.getTracks()
      const isScreenShare = streamId === participant.media.screenStreamId

      tracks.forEach((track) => {
        if (track.kind === 'audio' && 'isAudioEnabled' in updates) {
          track.enabled = updates.isAudioEnabled!
        } else if (track.kind === 'video') {
          if (isScreenShare && 'isScreenSharing' in updates) {
            track.enabled = updates.isScreenSharing!
          } else if (!isScreenShare && 'isVideoEnabled' in updates) {
            track.enabled = updates.isVideoEnabled!
          }
        }
      })
    })

    // Обновляем состояние, сохраняя существующие потоки
    participant.media = {
      ...participant.media,
      ...updates,
      streams: updatedStreams, // Важно: используем сохраненные потоки
    }

    this.emit('participantMediaChanged', { userId, media: participant.media })
    this.emit('stateChanged', this.getState())
  }

  /**
   * Вспомогательный метод для эмита состояния
   */
  private emitStateChanged(): void {
    const state = this.getState()
    console.group('🔄 State Changed')
    state.participants.forEach((participant) => {
      console.log(`Participant ${participant.userId}:`, {
        streams: Object.entries(participant.media.streams).map(([id, stream]) => ({
          id,
          tracks: stream.getTracks().map((t) => ({
            id: t.id,
            kind: t.kind,
            enabled: t.enabled,
          })),
        })),
        hasVideo: participant.media.hasVideo,
        isVideoEnabled: participant.media.isVideoEnabled,
        cameraStreamId: participant.media.cameraStreamId,
      })
    })
    console.groupEnd()
    this.emit('stateChanged', state)
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
    const participant = this.participants.get(userId)
    if (participant) {
      // Останавливаем треки во всех потоках
      if (participant.media.streams) {
        Object.values(participant.media.streams).forEach((stream) => {
          stream.getTracks().forEach((track) => track.stop())
        })
      }
      this.participants.delete(userId)
      this.emit('participantLeft', { userId })
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
      participants: Array.from(this.participants.values()).map((participant) => ({
        userId: participant.userId,
        userInfo: participant.userInfo,
        joinedAt: participant.joinedAt,
        media: {
          ...participant.media,
          streams: participant.media.streams,
        },
      })),
    }
  }

  /**
   * Очистка
   */
  destroy(): void {
    this.participants.forEach((participant) => {
      // Останавливаем треки во всех потоках
      if (participant.media.streams) {
        Object.values(participant.media.streams).forEach((stream) => {
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

'use client'

import { EventEmitter } from 'events'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

export interface UserSpeakingState {
  isSpeaking: boolean
  volume: number
}

export interface RoomSpeakingState {
  [userId: string]: UserSpeakingState
}

export interface VideoProps {
  stream?: MediaStream;
  className?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  currentUser?: UserInfo;
  streamType: 'screen' | 'camera';
}

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

  private speakingState: RoomSpeakingState = {}

  /**
   * Инициализация комнаты
   */
  init(info: RoomInfo): void {
    this.room = info
    this.participants.clear()
    this.speakingState = {}

    // Инициализируем начальных участников
    info.participants.forEach((user) => {
      const userId = String(user.userId)
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

      // Инициализируем состояние разговора
      this.speakingState[userId] = {
        isSpeaking: false,
        volume: 0,
      }
    })

    this.emit('initialized', this.getState())
  }

  handleSpeakingState(userId: string, isSpeaking: boolean, volume: number = 0): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    // Обновляем состояние в speakingState
    this.speakingState[userId] = {
      isSpeaking,
      volume,
    }

    this.emit('participantSpeakingChanged', {
      userId,
      isSpeaking,
      volume,
    })
  }

  /**
   * Обработка входящего трека
   */
  handleTrack(userId: string, track: MediaStreamTrack, stream: MediaStream): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    let currentStream = participant.media.streams[stream.id]
    if (!currentStream) {
      currentStream = new MediaStream()
      participant.media.streams[stream.id] = currentStream
    }

    currentStream.addTrack(track)

    if (track.kind === 'video') {
      participant.media.hasVideo = true
      if (stream.id !== participant.media.screenStreamId) {
        participant.media.cameraStreamId = stream.id
      }
    } else if (track.kind === 'audio') {
      participant.media.hasAudio = true
    }

    this.emitStateChanged()
  }

  /**
   * Инициализация состояния участника
   */
  handleInitialSetup(userId: string, setup: any): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    // Убираем флаги enabled пока не получим реальные треки
    participant.media = {
      ...participant.media,
      ...setup,
      hasVideo: false,
      hasAudio: false,
      streams: participant.media.streams,
    }

    // Обновляем состояние разговора если оно пришло в initial-setup
    if ('isSpeaking' in setup || 'volume' in setup) {
      this.speakingState[userId] = {
        isSpeaking: setup.isSpeaking || false,
        volume: setup.volume || 0,
      }
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
      stream?.getVideoTracks().forEach((track) => {
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
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = enabled
      })
    }

    this.emitStateChanged()
  }

  /**
   * Инициализация камеры
   */
  handleCameraStart(userId: string, streamId: string): void {
    // console.log('Handle Camera Start:', { userId, streamId })

    const participant = this.participants.get(userId)
    if (!participant) return

    participant.media.cameraStreamId = streamId
    participant.media.isVideoEnabled = true

    this.emitStateChanged()
  }

  handleAudioStart(userId: string, streamId: string): void {
    const participant = this.participants.get(userId)
    if (!participant) return

    participant.media.cameraStreamId = streamId
    participant.media.isAudioEnabled = true
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
    console.log('state', state)
    // console.group('🔄 State Changed')
    // state.participants.forEach((participant) => {
    //   console.log(`Participant ${participant.userId}:`, {
    //     streams: Object.entries(participant.media.streams).map(([id, stream]) => ({
    //       id,
    //       tracks: stream.getTracks().map((t) => ({
    //         id: t.id,
    //         kind: t.kind,
    //         enabled: t.enabled,
    //       })),
    //     })),
    //     hasVideo: participant.media.hasVideo,
    //     isVideoEnabled: participant.media.isVideoEnabled,
    //     cameraStreamId: participant.media.cameraStreamId,
    //   })
    // })
    // console.groupEnd()
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

      // Инициализируем состояние разговора для нового участника
      this.speakingState[userId] = {
        isSpeaking: false,
        volume: 0,
      }

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
    const remoteStreams = this.getRemoteStreams()
    return {
      roomId: this.room?.roomId,
      currentUser: this.room?.currentUser,
      s: remoteStreams,
      participants: Array.from(this.participants.values()),
    }
  }

  getRemoteStreams(): VideoProps[] {
    return Array.from(this.participants.values())
      .filter(({ userId }) => userId !== String(this.room?.currentUser.id))
      .reduce((acc: VideoProps[], participant) => {
        const { userInfo, media } = participant
        const {
          isAudioEnabled,
          isVideoEnabled,
          isScreenSharing,
          streams,
          screenStreamId,
          cameraStreamId,
          hasVideo,
          hasAudio,
        } = media

        // Камера - добавляем всегда
        acc.push({
          stream: cameraStreamId ? streams[cameraStreamId] : undefined,
          currentUser: userInfo,
          streamType: 'camera',
          isAudioEnabled: hasAudio && isAudioEnabled,
          isVideoEnabled: hasVideo && isVideoEnabled,
        })

        // Скриншеринг - только если есть
        if (screenStreamId && isScreenSharing) {
          acc.push({
            stream: streams[screenStreamId],
            currentUser: userInfo,
            streamType: 'screen',
            isAudioEnabled: false,
            isVideoEnabled: true,
          })
        }

        return acc
      }, [])
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

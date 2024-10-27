'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { makeCn } from '@utils/others'
import style from './Conference.module.scss'
import { useConferenceSocket } from '../../_hooks/useConferenceSocket'
import { useMediaStream } from '../../_hooks/useMediaStream'
import { MediaControls } from '../MediaControls'
import { VideoView } from '../VideoView'

const cn = makeCn('Conference', style)

interface ConferenceProps {
  profile: any
}

export function Conference(props: ConferenceProps) {
  const { profile } = props
  const { dialogId } = useParams<{ dialogId: string }>()

  // Состояние для хранения стримов участников
  const [participantStreams, setParticipantStreams] = useState<Map<string, MediaStream>>(new Map())
  const [participants, setParticipants] = useState<string[]>([])

  const {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useMediaStream()

  // Обработчики событий
  const handleUserJoined = (userId: string) => {
    setParticipants((prev) => [...prev, userId])
  }

  const handleUserLeft = (userId: string) => {
    setParticipants((prev) => prev.filter((id) => id !== userId))
    setParticipantStreams((prev) => {
      const newStreams = new Map(prev)
      newStreams.delete(userId)
      return newStreams
    })
  }

  // Обработка WebRTC сигналов
  const handleSignal = (userId: string, signal: any) => {
    // Если получили медиа стрим от участника
    if (signal.type === 'stream') {
      setParticipantStreams((prev) => {
        const newStreams = new Map(prev)
        newStreams.set(userId, signal.stream)
        return newStreams
      })
    }
  }

  // Подключаем WebRTC через хук
  const { sendSignal } = useConferenceSocket({
    dialogId,
    userId: profile?.user_info.id,
    stream, // Передаем локальный медиа стрим
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onSignal: handleSignal,
    getParticipants: setParticipants,
  })

  return (
    <div className={cn()}>
      <div className={cn('ParticipantsContainer')}>
        {/* Локальное видео */}
        <div className={cn('Participant')}>
          <VideoView
            stream={stream}
            muted // Локальное видео всегда muted
            isEnabled={isVideoEnabled}
          />
        </div>
        {/* Видео других участников */}
        {participants.map((participantId) => (
          <div key={participantId} className={cn('Participant')}>
            <VideoView
              stream={participantStreams.get(participantId)}
              muted={false}
              isEnabled
            />
          </div>
        ))}
      </div>
      <div className={cn('ActionsContainer')}>
        <MediaControls
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
        />
      </div>
    </div>
  )
}

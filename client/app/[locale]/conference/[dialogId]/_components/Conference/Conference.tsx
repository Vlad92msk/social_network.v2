'use client'

import { useParams } from 'next/navigation'
import { makeCn } from '@utils/others'
import { useEffect, useState } from 'react'
import { useConferenceSocket } from '../../_hooks/useConferenceSocket'
import style from './Conference.module.scss'
import { useMediaStream } from '../../_hooks/useMediaStream'
import { MediaControls } from '../MediaControls'
import { VideoView } from '../VideoView'

const cn = makeCn('Conference', style)

export function Conference() {
  const { dialogId } = useParams<{ dialogId: string }>()
  const {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useMediaStream()

  // Локальное состояние для участников конференции
  const [participants, setParticipants] = useState<string[]>([])
console.log('participants', participants)
  // Обработчик для добавления нового пользователя
  const handleUserJoined = (userId: string) => {
    setParticipants((prev) => [...prev, userId])
  }

  // Обработчик для удаления пользователя
  const handleUserLeft = (userId: string) => {
    setParticipants((prev) => prev.filter((id) => id !== userId))
  }

  // Обработчик сигналов (например, WebRTC)
  const handleSignal = (userId: string, signal: any) => {
    console.log(`Received signal from ${userId}`, signal)
    // Обработка сигнала (например, передача WebRTC offer/answer/ICE)
  }

  // Подключаем хук useConferenceSocket
  const { sendSignal } = useConferenceSocket({
    dialogId,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onSignal: handleSignal,
  })

  return (
    <div className={cn()}>
      <div className={cn('ParticipantsContainer')}>
        {participants.map((participantId) => (
          <div key={participantId} className={cn('Participant')}>
            <VideoView
              stream={stream}
              muted={participantId === 'self'}
              isEnabled={isVideoEnabled}
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

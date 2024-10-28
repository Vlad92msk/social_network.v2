'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { makeCn } from '@utils/others'
import { useSelector } from 'react-redux'
import { ConferenceSelectors } from '../../_store/selectors'
import { selectUsers } from '../../_store/selectors/conference.selectors'
import style from './Conference.module.scss'
import { useConferenceSocketConnect } from '../../_hooks'
import { useMediaStream } from '../../_hooks/useMediaStream'
import { WebRTCSignal } from '../../types/media'
import { MediaControls } from '../MediaControls'
import { VideoView } from '../VideoView'

const cn = makeCn('Conference', style)

interface ConferenceProps {
  profile: any
}

export function Conference(props: ConferenceProps) {
  const { profile } = props
  const { dialogId } = useParams<{ dialogId: string }>()

  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)
  const participants = useSelector(ConferenceSelectors.selectUsers)
  useConferenceSocketConnect({ conferenceId: dialogId })

  const {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useMediaStream()

  const [participantStreams, setParticipantStreams] = useState<Map<string, MediaStream>>(new Map())

  if (!isConnected) return <div>Connecting...</div>
  return (
    <div className={cn()}>
      {/* Локальное видео */}
      <div className={cn('ParticipantsContainer')}>
        <div className={cn('Participant')}>
          <VideoView
            stream={stream}
            muted
            isEnabled={isVideoEnabled}
          />
          <span>{profile?.user_info.id}</span>
        </div>

        {/* Видео других участников */}
        {participants.filter((id) => id !== profile?.user_info.id).map((participantId) => (
          <div key={participantId} className={cn('Participant')}>
            <VideoView
              stream={participantStreams.get(participantId)}
              muted={false}
              isEnabled // Это состояние нужно будет получать из сигнала
            />
            <span>
              User
              {participantId}
            </span>
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

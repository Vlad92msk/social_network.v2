'use client'

import { makeCn } from '@utils/others'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useConferenceSocketConnect } from '../../_hooks'
import { useMediaStream } from '../../_hooks/useMediaStream'
import { handleSignal } from '../../_store/actions/conference-thunk.actions'
import { ConferenceSliceActions } from '../../_store/conference.slice'
import { ConferenceSelectors } from '../../_store/selectors'
import { MediaControls } from '../MediaControls'
import { VideoView } from '../VideoView'
import style from './Conference.module.scss'

const cn = makeCn('Conference', style)

interface ConferenceProps {
  profile: any
}

export function Conference(props: ConferenceProps) {
  const { profile } = props
  const dispatch = useDispatch()
  const { dialogId } = useParams<{ dialogId: string }>()
  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)
  const participants = useSelector(ConferenceSelectors.selectUsers)
  const streams = useSelector(ConferenceSelectors.selectStreams)
  const signals = useSelector(ConferenceSelectors.selectUserSignals)

  useConferenceSocketConnect({ conferenceId: dialogId })

  const {
    stream: localStream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useMediaStream()

  // Обработка сигналов с проверкой на изменения
  useEffect(() => {
    const signalEntries = Object.entries(signals)
    if (signalEntries.length > 0) {
      signalEntries.forEach(([userId, { signal }]) => {
        if (signal) {
          dispatch(handleSignal(userId, signal))
          dispatch(ConferenceSliceActions.clearSignal({ userId }))
        }
      })
    }
  }, [signals, dispatch])

  // Сохраняем локальный стрим в store
  useEffect(() => {
    if (localStream) {
      dispatch(ConferenceSliceActions.addStream({ userId: 'local', stream: localStream }))
    }
  }, [localStream, dispatch])

  if (!isConnected) return <div>Connecting...</div>

  return (
    <div className={cn()}>
      <div className={cn('ParticipantsContainer')}>
        {/* Локальное видео */}
        <div className={cn('Participant')}>
          <VideoView
            stream={localStream}
            muted
            isEnabled={isVideoEnabled}
          />
          <span>{profile?.user_info.id}</span>
        </div>

        {/* Видео других участников */}
        {participants
          .filter((id) => id !== profile?.user_info.id)
          .map((participantId) => (
            <div key={participantId} className={cn('Participant')}>
              <VideoView
                stream={streams[participantId]}
                muted={false}
                isEnabled
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

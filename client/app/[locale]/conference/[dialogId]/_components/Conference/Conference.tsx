'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { makeCn } from '@utils/others'
import { ConferenceSliceActions } from '../../_store/conference.slice'
import style from './Conference.module.scss'
import { useWebRTC } from '../../_context/WebRTCContext'
import { useConferenceSocketConnect } from '../../_hooks'
import { useMediaStream } from '../../_hooks/useMediaStream'
import { useWebRTCSignal } from '../../_hooks/useWebRTCSignal'
import { ConferenceSelectors } from '../../_store/selectors'
import { MediaControls } from '../MediaControls'
import { VideoView } from '../VideoView'

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
  const signals = useSelector(ConferenceSelectors.selectUserSignals)

  const webRTC = useWebRTC()
  const {
    stream: localStream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useMediaStream()

  // Инициализируем WebRTC обработчик сигналов
  const { handleSignal } = useWebRTCSignal({
    stream: localStream,
    onSignal: (userId, signal) => {
      if (signal.type === 'stream') {
        webRTC.addStream(userId, signal.stream)
      }
    },
  })

  useConferenceSocketConnect({ conferenceId: dialogId })

  // Обработка локального стрима
  useEffect(() => {
    if (localStream) {
      webRTC.addStream('local', localStream)
    }
  }, [localStream, webRTC])

  // Обработка входящих сигналов
  useEffect(() => {
    const signalEntries = Object.entries(signals)
    if (signalEntries.length > 0) {
      signalEntries.forEach(([userId, { signal }]) => {
        if (signal) {
          handleSignal(userId, signal)
          dispatch(ConferenceSliceActions.clearSignal({ userId }))
        }
      })
    }
  }, [signals, dispatch, handleSignal])

  // Обработка отключения пользователей
  useEffect(() => () => {
    // Очистка при размонтировании
    participants.forEach((userId) => {
      webRTC.removeConnection(userId)
      webRTC.removeStream(userId)
    })
  }, [participants, webRTC])

  if (!isConnected) return <div>Connecting...</div>

  return (
    <div className={cn()}>
      <div className={cn('ParticipantsContainer')}>
        {/* Локальное видео */}
        <div className={cn('Participant')}>
          <VideoView
            stream={webRTC.getStream('local')}
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
                stream={webRTC.getStream(participantId)}
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

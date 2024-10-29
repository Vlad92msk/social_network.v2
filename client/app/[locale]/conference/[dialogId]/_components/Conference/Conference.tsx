'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMediaStream } from '@ui/components/media-stream/context/MediaStreamContext'
import { VideoView } from '@ui/components/media-stream/VideoView'
import { makeCn } from '@utils/others'
import style from './Conference.module.scss'
import { useWebRTC } from '../../_context/WebRTCContext'
import { useConferenceSocketConnect } from '../../_hooks'
import { useWebRTCSignal } from '../../_hooks/useSignal'
import { ConferenceSliceActions } from '../../_store/conference.slice'
import { ConferenceSelectors } from '../../_store/selectors'
import { MediaControls } from '../MediaControls'

const cn = makeCn('Conference', style)

interface ConferenceProps {
  profile: any
}

export function Conference({ profile }: ConferenceProps) {
  const dispatch = useDispatch()
  const { dialogId } = useParams<{ dialogId: string }>()
  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)
  const participants = useSelector(ConferenceSelectors.selectUsers)
  const signals = useSelector(ConferenceSelectors.selectUserSignals)

  useConferenceSocketConnect({ conferenceId: dialogId })

  const { addStream, getStream, removeStream, removeConnection } = useWebRTC()

  const {
    stream: localStream,
    isVideoEnabled, isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useMediaStream()

  console.clear()
  console.log('localStream', localStream)
  console.log('isVideoEnabled', isVideoEnabled)
  console.log('isAudioEnabled', isAudioEnabled)
  // Подключение и создание WebRTC соединений
  // @ts-ignore
  const { handleSignal, createConnection } = useWebRTCSignal({ localStream })

  // Обработка и установка соединений
  useEffect(() => {
    if (!localStream || !profile?.user_info.id) return

    participants.forEach(async (participantId) => {
      if (participantId === profile.user_info.id) return

      const shouldInitiate = profile.user_info.id < participantId
      if (shouldInitiate) {
        try {
          // Передаем localStream при создании соединения
          await createConnection(participantId, true, localStream)
        } catch (error) {
          console.error('Error creating connection:', error)
        }
      }
    })
  }, [participants, localStream, profile?.user_info.id, createConnection])

  // Обработка входящих сигналов
  useEffect(() => {
    Object.entries(signals).forEach(async ([userId, { signal }]) => {
      if (signal) {
        try {
          await handleSignal(userId, signal)
          dispatch(ConferenceSliceActions.clearSignal({ userId }))
        } catch (error) {
          console.error('Error handling signal:', error)
        }
      }
    })
  }, [signals, dispatch, handleSignal])

  // Добавление локального стрима
  useEffect(() => {
    if (localStream) {
      addStream('local', localStream)
    }
  }, [localStream, addStream])

  // Очистка соединений при размонтировании
  useEffect(() => () => {
    participants.forEach((userId) => {
      removeConnection(userId)
      removeStream(userId)
    })
  }, [participants, removeConnection, removeStream])

  // Обновление состояния медиа треков
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      const audioTrack = localStream.getAudioTracks()[0]
      if (videoTrack) videoTrack.enabled = isVideoEnabled
      if (audioTrack) audioTrack.enabled = isAudioEnabled
    }
  }, [localStream, isVideoEnabled, isAudioEnabled])

  if (!isConnected) return <div>Connecting...</div>

  // console.log('webRTC.getStream(\'local\')', getStream('local'))
  return (
    <div className="conference">
      <div className="ParticipantsContainer">
        <div className="Participant">
          <VideoView stream={localStream} muted isEnabled={isVideoEnabled} />
          <span>
            {profile?.user_info.id}
            {' '}
            (You)
          </span>
        </div>
        {participants
          .filter((id) => id !== String(profile?.user_info.id))
          .map((participantId) => (
            <div key={participantId} className="Participant">
              <VideoView stream={getStream(participantId)} muted={false} isEnabled />
              <span>
                User
                {participantId}
              </span>
            </div>
          ))}
      </div>
      <div className="ActionsContainer">
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

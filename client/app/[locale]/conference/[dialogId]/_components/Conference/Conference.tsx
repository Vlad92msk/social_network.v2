'use client'

import { useEffect, useRef } from 'react'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { CallControls, LocalPreview } from '../../_webRTC1/components/components'
import { RemoteVideo } from '../../_webRTC1/components-remote/remoteVideo'
import { useConference } from '../../_webRTC1/context'

interface ConferenceProps {
  profile?: UserProfileInfo;
}

interface VideoProps {
  stream: MediaStream;
  className?: string;
}

export function VideoStream({ stream, className }: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
    />
  )
}

export function Conference({ profile }: ConferenceProps) {
  const {
    isInitialized,
    localScreenShare,
    startScreenShare,
    stopScreenShare,
    streams,
    participants,
    userEvents,
  } = useConference()


  if (!isInitialized) {
    return (
      <div className={styles.conferenceLoading}>
        <p>Подключение к конференции...</p>
      </div>
    )
  }

  const ddd = streams?.reduce((acc, user) => {
    const d = user.streams.map((stream) => ({ userId: user.userId, stream }))
    // @ts-ignore
    acc.push(...d)
    return acc
  }, [])

  return (
    <div className={styles.conference}>
      <div className={styles.participantsContainer}>
        {/* Локальный пользователь */}
        <div className={styles.participant}>
          <LocalPreview />
          <span className={styles.participantName}>
            {profile?.user_info.id}
            {' '}
            (You)
          </span>
        </div>

        {/* Локальный скриншеринг */}
        {localScreenShare.isVideoEnabled && (
          <div className={styles.participant}>
            <RemoteVideo stream={localScreenShare.stream} />
            <span className={styles.participantName}>
              Your Screen Share
            </span>
          </div>
        )}

        {/* Потоки других участников */}
        {ddd?.map(({ userId, stream }) => {
          // @ts-ignore
          const streamType = userEvents[stream.id]?.streamType
          // @ts-ignore
          const mickActive = userEvents[stream.id]?.mickActive
          return (
            // @ts-ignore
            <div key={stream.id} className={styles.participant}>
              <VideoStream
                stream={stream}
                className={styles.video}
              />
              <span className={styles.participantName}>
                {`${userId} (${streamType})`}
              </span>
              <span className={styles.participantMic}>
                {streamType === 'camera' ? mickActive && '🎤' : null}
              </span>
            </div>
          )
        })}
      </div>

      <div className={styles.actionsContainer}>
        <div className={styles.mediaControls}>
          <CallControls />
          <button
            className={`${styles.button} ${localScreenShare.isVideoEnabled ? styles.buttonActive : ''}`}
            onClick={() => {
              if (localScreenShare.isVideoEnabled) {
                stopScreenShare()
              } else {
                startScreenShare()
              }
            }}
          >
            {localScreenShare.isVideoEnabled ? '🎥 Остановить трансляцию' : '📺 Начать трансляцию экрана'}
          </button>
        </div>

        {/* Можно добавить отображение количества участников */}
        <div className={styles.participantsInfo}>
          Участников:
          {' '}
          {participants.length || 0}
        </div>
      </div>
    </div>
  )
}

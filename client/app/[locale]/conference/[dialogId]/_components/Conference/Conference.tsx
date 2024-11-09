'use client'

import { useEffect } from 'react'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { CallControls, LocalPreview } from '../../_webRTC1/components/components'
import { RemoteVideo } from '../../_webRTC1/components-remote/remoteVideo'
import { useConference } from '../../_webRTC1/context'

interface ConferenceProps {
  profile?: UserProfileInfo;
}

export function Conference({ profile }: ConferenceProps) {
  const {
    isInitialized,
    media,
    participants,
    localScreenShare,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
  } = useConference()

  useEffect(() => {
    console.log('Participants changed in component:', participants)
  }, [participants])

  if (!isInitialized) {
    return (
      <div className={styles.conferenceLoading}>
        <p>Подключение к конференции...</p>
      </div>
    )
  }

  return (
    <div className={styles.conference}>
      <div className={styles.participantsContainer}>
        <div className={styles.participant}>
          <LocalPreview />
          <span className={styles.participantName}>
            {profile?.user_info.id}
            {' '}
            (You)
          </span>
        </div>
        {localScreenShare.isVideoEnabled && (
          <RemoteVideo stream={localScreenShare.stream} />
        )}
      </div>

      <div className={styles.actionsContainer}>
        <div className={styles.mediaControls}>
          <CallControls />
          <button
            className={styles.button}
            onClick={() => {
              if (localScreenShare.isVideoEnabled) {
                stopScreenShare()
              } else {
                startScreenShare()
              }
            }}
          >
            {localScreenShare.isVideoEnabled ? '🎥 Выкл трансляцию' : '📵 Вкл трансляцию'}
          </button>
        </div>
      </div>
    </div>
  )
}

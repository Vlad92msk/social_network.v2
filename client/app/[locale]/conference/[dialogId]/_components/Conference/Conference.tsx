'use client'

import { useEffect } from 'react'
import { CallControls, LocalPreview } from '../../_webRTC1/components/components'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { useConference } from '../../_webRTC1/context'

interface ConferenceProps {
  profile?: UserProfileInfo;
}

export function Conference({ profile }: ConferenceProps) {
  const {
    isInitialized,
    media,
    participants,
    toggleVideo,
    toggleAudio,
    startLocalStream,
    stopLocalStream,
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
      </div>

      <div className={styles.actionsContainer}>
        <div className={styles.mediaControls}>
         <CallControls />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
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
          {media.stream && (
            <video
              ref={(el) => {
                if (el) el.srcObject = media.stream
              }}
              autoPlay
              muted
              className="w-64 h-48 bg-black"
            />
          )}
          <span className={styles.participantName}>
            {profile?.user_info.id}
            {' '}
            (You)
          </span>
        </div>
      </div>

      <h3>All Participants:</h3>
      <pre>Debug: {JSON.stringify(participants, null, 2)}</pre>
      {participants.map((userId) => {
        console.log('Mapping userId:', userId) // Посмотрим каждую итерацию
        return (
          <div key={userId} className={styles.participantItem}>
            <p>ID: {userId}</p>
            <p>Is You: {userId === String(profile?.user_info.id) ? 'Yes' : 'No'}</p>
          </div>
        )
      })}

      <div className={styles.actionsContainer}>
        <div className={styles.mediaControls}>
          <button
            onClick={() => toggleVideo()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {media.isVideoEnabled ? 'Disable' : 'Enable'}
            {' '}
            Video
          </button>
          <button
            onClick={() => toggleAudio()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {media.isAudioEnabled ? 'Mute' : 'Unmute'}
          </button>
        </div>
      </div>
    </div>
  )
}

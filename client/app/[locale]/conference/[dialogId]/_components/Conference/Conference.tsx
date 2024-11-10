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
    localScreenShare,
    startScreenShare,
    stopScreenShare,
    streams,
    participants,
  } = useConference()

  // Получаем все потоки участников
  const remoteStreams = streams || []

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
        {remoteStreams.map(({ userId, stream, type }) => (
          <div
            key={`${userId}-${type}`}
            className={styles.participant}
          >
            <RemoteVideo stream={stream} />
            <span className={styles.participantName}>
              {userId}
              {type === 'screen' ? ' (Screen)' : ''}
            </span>
          </div>
        ))}
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

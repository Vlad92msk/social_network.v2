'use client'

import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { CallControls, LocalPreview } from '@ui/components/media-stream/components/components'
import { RemoteVideo } from '@ui/components/media-stream/components-remote/remoteVideo'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { useConferenceSocketConnect } from '../../_hooks'
import { useWebRTCContext } from '../../_services/ConferenceContext'
import { ConferenceSelectors } from '../../_store/selectors'
import { useWebRTCSignaling } from '../../_hooks/useWebRTCSignaling'

interface ConferenceProps {
  profile?: UserProfileInfo;
}

export function Conference({ profile }: ConferenceProps) {
  const { dialogId } = useParams<{ dialogId: string }>()

  useConferenceSocketConnect({ conferenceId: dialogId })
  const { streams, handleSignal, connectionStatus } = useWebRTCContext()

  // Подключаем обработку WebRTC сигналов
  useWebRTCSignaling(profile?.user_info.id, handleSignal)

  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)


  if (!isConnected) {
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

        {Object.entries(streams).map(([userId, stream]) => (
          <div key={userId} className={styles.participant}>
            <RemoteVideo stream={stream} />
            <span className={styles.participantName}>
              {userId}
              {' '}
              ({connectionStatus[userId] || 'connecting'})
            </span>
          </div>
        ))}
      </div>

      <div className={styles.actionsContainer}>
        <div className={styles.mediaControls}>
          <CallControls />
        </div>
      </div>
    </div>
  )
}

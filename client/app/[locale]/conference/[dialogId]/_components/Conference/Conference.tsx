'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { CallControls, LocalPreview } from '../../components/components'
import { useConference } from '../../web-rtc/context'

interface ConferenceProps {
  profile?: UserProfileInfo;
}

interface VideoProps {
  stream?: MediaStream;
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

function ParticipantVideo({ participant, currentUserId }: { participant: any, currentUserId: string }) {
  const isCurrentUser = participant.userId === currentUserId

  // Для текущего пользователя всегда показываем профиль без проверки потоков
  if (isCurrentUser || participant.streams.size === 0) {
    return (
      <div className={styles.participant}>
        <div className={styles.profileImageContainer}>
          <img
            src={participant.userInfo.profile_image}
            alt={participant.userInfo.name}
            className={styles.profileImage}
          />
        </div>
        <span className={styles.participantName}>
          {participant.userInfo.name}
          {isCurrentUser ? ' (You)' : ''}
        </span>
      </div>
    )
  }
  return null
}

export function Conference({ profile }: ConferenceProps) {
  const [pinnedStream, setPinnedStream] = useState<{
    userId: string;
    stream: MediaStream;
    isLocal?: boolean;
    isScreenShare?: boolean;
  } | null>(null)

  const {
    isInitialized,
    localScreenShare,
    participants: allParticipants,
    media: { stream: localStream },
  } = useConference()
  const currentUserId = profile?.user_info.id.toString() || ''

  const participants = allParticipants.filter(({ userId }) => userId !== currentUserId)

  if (!isInitialized) {
    return (
      <div className={styles.conferenceLoading}>
        <p>Подключение к конференции...</p>
      </div>
    )
  }

  // Преобразуем Set streams в массив для каждого участника
  const getStreamsList = () => participants.reduce((acc, participant) => {
    const streams = Array.from(participant.streams).map((stream) => ({
      userId: participant.userId,
      stream,
      userInfo: participant.userInfo,
      mickActive: participant.mickActive,
      streamsType: participant.streamsType,
    }))
    return [...acc, ...streams]
  }, [] as Array<{
      userId: string;
      stream: MediaStream;
      streamsType: Record<string, string>
      userInfo: {
        id: number;
        name: string;
        profile_image: string;
        public_id: string;
      };
      mickActive: boolean;
    }>)

  const handleStreamClick = (streamData: any, type: 'remote' | 'local' | 'screenShare') => {
    if (type === 'local') {
      if (pinnedStream?.isLocal) {
        setPinnedStream(null)
      } else {
        setPinnedStream({
          userId: profile?.user_info.id.toString() || '',
          stream: streamData,
          isLocal: true,
        })
      }
    } else if (type === 'screenShare') {
      if (pinnedStream?.isScreenShare) {
        setPinnedStream(null)
      } else {
        setPinnedStream({
          userId: profile?.user_info.id.toString() || '',
          stream: streamData,
          isScreenShare: true,
        })
      }
    } else if (pinnedStream?.stream.id === streamData.stream.id) {
      setPinnedStream(null)
    } else {
      setPinnedStream(streamData)
    }
  }

  const renderStream = (streamData: any, isPinned = false) => (
    <div
      key={streamData.stream.id}
      className={`${styles.participant} ${!isPinned && 'cursor-pointer'}`}
      onClick={() => handleStreamClick(streamData, 'remote')}
    >
      <VideoStream stream={streamData.stream} className={styles.video} />
      <span className={styles.participantName}>
        {streamData.userInfo.name}
      </span>
      {
        streamData.streamsType[streamData.stream.id] === 'camera' ? (
          <span className={styles.participantMic}>
            {streamData.mickActive ? '🎤' : '🚫'}
          </span>
        ) : null
      }
    </div>
  )

  const renderMainContent = () => {
    if (pinnedStream) {
      if (pinnedStream.isLocal) {
        return (
          <div
            className={styles.participant}
            onClick={() => handleStreamClick(localStream, 'local')}
          >
            <LocalPreview />
            <span className={styles.participantName}>
              {profile?.user_info.name}
              {' '}
              (You)
            </span>
          </div>
        )
      }
      if (pinnedStream.isScreenShare) {
        return (
          <div
            className={styles.participant}
            onClick={() => handleStreamClick(localScreenShare.stream, 'screenShare')}
          >
            <VideoStream stream={localScreenShare.stream} />
            <span className={styles.participantName}>Your Screen Share</span>
          </div>
        )
      }
      return renderStream(pinnedStream, true)
    }

    return (
      <>
        <div
          className={styles.participant}
          onClick={() => handleStreamClick(localStream, 'local')}
        >
          <LocalPreview />
          <span className={styles.participantName}>
            {profile?.user_info.name}
            {' '}
            (You)
          </span>
        </div>
        {localScreenShare.isVideoEnabled && localScreenShare.stream && (
          <div
            className={styles.participant}
            onClick={() => handleStreamClick(localScreenShare.stream, 'screenShare')}
          >
            <VideoStream stream={localScreenShare.stream} />
            <span className={styles.participantName}>Your Screen Share</span>
          </div>
        )}
        {getStreamsList()
          .filter((streamData) => streamData.userId !== currentUserId)
          .map((streamData) => renderStream(streamData))}
        {participants
          .filter((participant) => {
            // Показываем участников без потоков и текущего пользователя
            const isCurrentUser = participant.userId === currentUserId
            return isCurrentUser || participant.streams.size === 0
          })
          .map((participant) => (
            <ParticipantVideo
              key={participant.userId}
              participant={participant}
              currentUserId={currentUserId}
            />
          ))}
      </>
    )
  }

  const renderSideContent = () => {
    if (!pinnedStream) {
      return participants.map((participant) => (
        <div key={participant.userId}>
          {participant.userInfo.name}
          {participant.userId === currentUserId ? ' (You)' : ''}
        </div>
      ))
    }

    const streamsList = getStreamsList()

    return (
      <>
        {!pinnedStream.isLocal && (
          <div
            className={styles.participant}
            onClick={() => handleStreamClick(localStream, 'local')}
          >
            <LocalPreview />
            <span className={styles.participantName}>
              {profile?.user_info.name}
              {' '}
              (You)
            </span>
          </div>
        )}
        {!pinnedStream.isScreenShare
          && localScreenShare.isVideoEnabled
          && localScreenShare.stream && (
            <div
              className={styles.participant}
              onClick={() => handleStreamClick(localScreenShare.stream, 'screenShare')}
            >
              <VideoStream stream={localScreenShare.stream} />
              <span className={styles.participantName}>Your Screen Share</span>
            </div>
        )}
        {streamsList
          .filter((streamData) => streamData.stream.id !== pinnedStream.stream?.id
            && streamData.userId !== currentUserId)
          .map((streamData) => renderStream(streamData))}
        {participants
          .filter((participant) => {
            const isCurrentUser = participant.userId === currentUserId
            return (isCurrentUser || participant.streams.size === 0)
              && (!pinnedStream.isLocal || participant.userId !== currentUserId)
          })
          .map((participant) => (
            <ParticipantVideo
              key={participant.userId}
              participant={participant}
              currentUserId={currentUserId}
            />
          ))}
      </>
    )
  }

  return (
    <div className={styles.conference}>
      <div className={styles.participantsContainer}>
        <div className={styles.remoteStreams}>{renderMainContent()}</div>
        {Boolean(pinnedStream) && (
          <div className={styles.participantList}>
            <div className={styles.participantsInfo}>
              Участников:
              {' '}
              {participants.length || 0}
            </div>
            {renderSideContent()}
          </div>
        )}
      </div>
      <div className={styles.actionsContainer}>
        <div className={styles.mediaControls}>
          <CallControls />
        </div>
      </div>
    </div>
  )
}

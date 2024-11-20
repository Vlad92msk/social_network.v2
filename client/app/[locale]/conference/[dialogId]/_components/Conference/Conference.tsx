'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { CallControls, LocalPreview } from '../../components/components'
import { useConference } from '../../_web-rtc/context'

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

export function Conference({ profile }: ConferenceProps) {
  const [pinnedStream, setPinnedStream] = useState<{
    userId: string;
    stream: any;
    isLocal?: boolean;
    isScreenShare?: boolean;
  } | null>(null)

  const {
    isInitialized,
    localScreenShare,
    streams,
    participants,
    userEvents,
    media: { stream: localStream },
  } = useConference()

  if (!isInitialized) {
    return (
      <div className={styles.conferenceLoading}>
        <p>Подключение к конференции...</p>
      </div>
    )
  }

  const streamsList = streams?.reduce((acc, user) => {
    const d = user.streams.map((stream) => ({ userId: user.userId, stream }))
    // @ts-ignore
    acc.push(...d)
    return acc as any[]
  }, [])

  const handleStreamClick = (streamData: any, type: 'remote' | 'local' | 'screenShare') => {
    if (type === 'local') {
      if (pinnedStream?.isLocal) {
        setPinnedStream(null)
      } else {
        setPinnedStream({
          // @ts-ignore
          userId: profile?.user_info.id || '',
          stream: streamData,
          isLocal: true,
        })
      }
    } else if (type === 'screenShare') {
      if (pinnedStream?.isScreenShare) {
        setPinnedStream(null)
      } else {
        setPinnedStream({
          // @ts-ignore
          userId: profile?.user_info.id || '',
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

  const renderStream = (stream: any, isPinned = false) => {
    const streamType = userEvents[stream.stream.id]?.streamType
    const mickActive = userEvents[stream.stream.id]?.mickActive

    return (
      <div
        key={stream.stream.id}
        className={`${styles.participant} ${!isPinned && 'cursor-pointer'}`}
        onClick={() => handleStreamClick(stream, 'remote')}
      >
        <VideoStream stream={stream.stream} className={styles.video} />
        <span className={styles.participantName}>
          {`${stream.userId} (${streamType})`}
        </span>
        <span className={styles.participantMic}>
          {streamType === 'camera' ? mickActive && '🎤' : null}
        </span>
      </div>
    )
  }

  const renderMainContent = () => {
    if (pinnedStream) {
      if (pinnedStream.isLocal) {
        return (
          <div
            className={styles.participant}
            onClick={() => handleStreamClick(localStream, 'local')}
          >
            <LocalPreview />
            {profile?.user_info.id}
            {' '}
            (You)
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
          {profile?.user_info.id}
          {' '}
          (You)
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
        {streamsList?.map((stream) => renderStream(stream))}
      </>
    )
  }

  const renderSideContent = () => {
    if (!pinnedStream) {
      return participants.map((participant) => (
        <div key={participant.userId}>{participant.userId}</div>
      ))
    }

    return (
      <>
        {!pinnedStream.isLocal && (
          <div
            className={styles.participant}
            onClick={() => handleStreamClick(localStream, 'local')}
          >
            <LocalPreview />
            {profile?.user_info.id}
            {' '}
            (You)
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
          ?.filter((stream) => stream.stream.id !== pinnedStream.stream?.id)
          .map((stream) => renderStream(stream))}
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

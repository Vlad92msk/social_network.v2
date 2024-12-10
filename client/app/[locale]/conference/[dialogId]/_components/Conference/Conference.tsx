'use client'

import React, {
  JSX, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react'
import { Icon } from '@ui/common/Icon'
import { Image } from '@ui/common/Image'
import { classNames } from '@utils/others'
import styles from './Conference.module.scss'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'
import { CallControls } from '../../components/components'
import { useCameraStream, useScreenShareStream } from '../../hooks/useCameraStream'
import { useConference, useConferenceUserSpeaking } from '../../web-rtc/context'

interface VideoProps {
  stream?: MediaStream;
  className?: string;
  isVideoEnabled: boolean,
  isAudioEnabled: boolean,
  currentUser?: UserInfo
  streamType?: 'screen' | 'camera'
  onClick?: VoidFunction
}

function Mic({ userId, isMicActive }: { userId: string, isMicActive: boolean }) {
  const isSpeaking = useConferenceUserSpeaking(userId)

  return (
    <div className={styles.micContainer}>
      <Icon
        name="microphone-off"
        className={`${styles.micIcon} ${isMicActive ? styles.hidden : ''}`}
      />
      <div
        className={`${styles.AudioLine} ${isSpeaking && isMicActive ? styles.active : styles.inactive}`}
      >
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

export function LocalPreview({ className, onClick }: { className?: string, onClick?: VoidFunction }) {
  const { videoProps, currentUser, showPlaceholder, localMedia } = useCameraStream()
  const isActiveMicrophone = localMedia.isAudioEnabled && !localMedia.isAudioMuted

  return (
    <div className={classNames(className, styles.participant)} onClick={onClick}>
      <video
        {...videoProps}
        className={`${styles.video} ${styles.videoMirrored}`}
        style={{ display: showPlaceholder ? 'none' : 'block' }}
      />
      {showPlaceholder && (
        <div className={styles.profileImageContainer}>
          <Image className={styles.profileImage} src={currentUser?.profile_image || ''} alt={currentUser?.name || ''} width={125} height={50} />
        </div>
      )}
      <span className={styles.participantName}>Вы</span>
      <Mic userId={String(currentUser?.id)} isMicActive={isActiveMicrophone} />
    </div>
  )
}

export function LocalScreenShare({ className, onClick }: { className?: string, onClick?: VoidFunction }) {
  const { videoProps, isVideoEnabled } = useScreenShareStream()

  if (!isVideoEnabled) return null
  return (
    <div className={classNames(className, styles.participant)} onClick={onClick}>
      <video
        {...videoProps}
        className={`${styles.video} ${styles.videoMirrored}`}
      />
      <span className={styles.participantName}>Вы (screen)</span>
    </div>
  )
}

export function RemoteStream(props: VideoProps) {
  const {
    stream,
    className,
    isVideoEnabled,
    currentUser,
    streamType,
    isAudioEnabled,
  } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasVideo = isVideoEnabled && (stream?.getVideoTracks().length || 0) > 0

  useEffect(() => {
    if (stream && videoRef.current && isVideoEnabled) {
      videoRef.current.srcObject = stream
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [isVideoEnabled, stream])

  const mediaProps = useMemo(() => ({
    autoPlay: true,
    playsInline: true,
    muted: true,
  }), [])

  return (
    <div className={classNames(styles.participant, className)}>
      <video
        ref={videoRef}
        {...mediaProps}
        style={{ display: !isVideoEnabled ? 'none' : 'block' }}
      />

      {!hasVideo && (
        <div className={styles.profileImageContainer}>
          <Image
            className={styles.profileImage}
            src={currentUser?.profile_image || ''}
            alt={currentUser?.name || ''}
            width={125}
            height={50}
          />
        </div>
      )}

      <span className={styles.participantName}>
        {`${currentUser?.name} ${streamType === 'screen' ? '(screen)' : ''}`}
      </span>

      {streamType === 'camera' && (
        <Mic userId={String(currentUser?.id)} isMicActive={isAudioEnabled} />
      )}
    </div>
  )
}

export function Conference() {
  const {
    isInitialized,
    screenShare: { isVideoEnabled },
    roomInfo: { s: remoteStreams },
  } = useConference()

  const [pinnedStreamId, setPinnedStreamId] = useState<string | null>(null)
  const [isLocalPinned, setIsLocalPinned] = useState(false)
  const [isLocalScreenPinned, setIsLocalScreenPinned] = useState(false)

  const handleStreamClick = useCallback((streamId: string | undefined) => {
    if (!streamId) return
    setIsLocalPinned(false)
    setIsLocalScreenPinned(false)
    setPinnedStreamId(pinnedStreamId === streamId ? null : streamId)
  }, [pinnedStreamId])

  const handleLocalPreviewClick = useCallback(() => {
    setPinnedStreamId(null)
    setIsLocalScreenPinned(false)
    setIsLocalPinned(!isLocalPinned)
  }, [isLocalPinned])

  const handleLocalScreenClick = useCallback(() => {
    setPinnedStreamId(null)
    setIsLocalPinned(false)
    setIsLocalScreenPinned(!isLocalScreenPinned)
  }, [isLocalScreenPinned])

  const pinnedStream = remoteStreams.find((props) => props.stream?.id === pinnedStreamId)
  const unpinnedStreams = remoteStreams.filter((props) => props.stream?.id !== pinnedStreamId)

  const renderMainContent = () => {
    if (isLocalPinned) {
      return <LocalPreview className={styles.pin} onClick={handleLocalPreviewClick} />
    }
    if (isLocalScreenPinned) {
      return <LocalScreenShare className={styles.pin} onClick={handleLocalPreviewClick} />
    }
    if (pinnedStream) {
      return <RemoteStream {...pinnedStream} className={styles.pin} onClick={() => handleStreamClick(pinnedStream.stream?.id)} />
    }
    return (
      <React.Fragment key={new Date().toISOString()}>
        <LocalPreview onClick={handleLocalPreviewClick} />
        {remoteStreams.map((props) => (
          <RemoteStream key={props.stream?.id} onClick={() => handleStreamClick(props.stream?.id)} {...props} />
        ))}
        <LocalScreenShare onClick={handleLocalScreenClick} />
      </React.Fragment>
    )
  }

  const renderParticipantList = () => {
    if (!isLocalPinned && !isLocalScreenPinned && !pinnedStream) return null

    const streamsCount = remoteStreams.length
    return (
      <div className={styles.participantList}>
        <div className={styles.participantsInfo}>
          {`Участники (${streamsCount})`}
        </div>
        {!isLocalPinned && <div onClick={handleLocalPreviewClick}><LocalPreview /></div>}
        {unpinnedStreams.map((props) => (
          <div key={props.stream?.id} onClick={() => handleStreamClick(props.stream?.id)}>
            <RemoteStream key={props.stream?.id} onClick={() => handleStreamClick(props.stream?.id)} {...props} />
          </div>
        ))}
        {!isLocalScreenPinned && isVideoEnabled && <div onClick={handleLocalScreenClick}><LocalScreenShare /></div>}
      </div>
    )
  }

  console.log('_______')
  if (!isInitialized) {
    return (
      <div>
        <p>Подключение к конференции...</p>
      </div>
    )
  }

  return (
    <div className={styles.conference}>
      <div className={styles.participantsContainer}>
        <div className={styles.remoteStreams}>
          {renderMainContent()}
        </div>
        {renderParticipantList()}
      </div>

      <div className={styles.actionsContainer}>
        <div className={styles.mediaControls}>
          <CallControls />
        </div>
      </div>
    </div>
  )
}

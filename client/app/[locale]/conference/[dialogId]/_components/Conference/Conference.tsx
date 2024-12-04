'use client'

import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@ui/common/Icon'
import { Image } from '@ui/common/Image'
import styles from './Conference.module.scss'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'
import { CallControls } from '../../components/components'
import { useCameraStream, useScreenShareStream } from '../../hooks/useCameraStream'
import { useConference } from '../../web-rtc/context'

interface VideoProps {
  stream?: MediaStream;
  className?: string;
  isVideoEnabled?: boolean,
  isAudioEnabled?: boolean,
  currentUser?: UserInfo
  streamType?: 'screen' | 'camera'
}

export function LocalPreview() {
  const { videoProps, currentUser, showPlaceholder, localMedia } = useCameraStream({
    mirror: true,
  })

  const isActiveMicrophone = localMedia.isAudioEnabled && !localMedia.isAudioMuted

  return (
    <div className={styles.participant}>
      <video
        {...videoProps}
        className={`${styles.video} ${styles.videoMirrored}`}
        style={{ display: showPlaceholder ? 'none' : 'block' }}
      />
      {showPlaceholder && (
        <div className={styles.profileImageContainer}>
          <Image className={styles.profileImage} src={currentUser?.profile_image || ''} alt={currentUser?.name || ''} width={125} height={50}/>
        </div>
      )}
      <span className={styles.participantName}>Вы</span>
      {isActiveMicrophone
        ? (
          <Icon
            name="microphone"
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
            }}
          />
        )
        : (
          <Icon
            name="microphone-off"
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
            }}
          />
        )}
    </div>
  )
}

export function LocalScreenShare() {
  const {
    videoProps,
    isVideoEnabled
  } = useScreenShareStream()

  if (!isVideoEnabled) return null
  return (
    <div className={styles.participant}>
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
    isAudioEnabled,
    currentUser,
    streamType,
  } = props
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      if (stream && stream !== videoRef.current.srcObject) {
        videoRef.current.srcObject = null // Сначала очищаем
        videoRef.current.srcObject = stream // Затем устанавливаем новый поток

        // Дожидаемся загрузки метаданных перед воспроизведением
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error)
        }
      }
    }
  }, [stream])

  const videoProps = useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted: true,
  }), [])

  return (
    <div className={styles.participant}>
      <video
        {...videoProps}
        style={{ display: !isVideoEnabled ? 'none' : 'block' }}
      />
      {!isVideoEnabled && (
        <div className={styles.profileImageContainer}>
          <Image className={styles.profileImage} src={currentUser?.profile_image || ''} alt={currentUser?.name || ''} width={125} height={50} />
        </div>
      )}
      <span className={styles.participantName}>{`${currentUser?.name} ${streamType === 'screen' ? '(screen)' : ''}`}</span>
      {!isAudioEnabled && streamType === 'camera'
        && (
          <Icon
            name="microphone-off"
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
            }}
          />
        )}
    </div>
  )
}

export function Conference() {
  const {
    isInitialized,
    participants,
    currentUser,
  } = useConference()

  const [pinnedStreamId, setPinnedStreamId] = useState<string | null>(null)
  const [isLocalPinned, setIsLocalPinned] = useState(false)
  const [isLocalScreenPinned, setIsLocalScreenPinned] = useState(false)


  if (!isInitialized) {
    return (
      <div className={styles.conferenceLoading}>
        <p>Подключение к конференции...</p>
      </div>
    )
  }

  const remoteStreams = participants
    .filter(({ userId }) => userId !== String(currentUser?.id))
    .reduce((acc: VideoProps[], { userId, userInfo, media }) => {
      const {
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        streams,
        screenStreamId,
        cameraStreamId,
      } = media

      // Получаем потоки из объекта streams
      const screenStream = screenStreamId ? streams[screenStreamId] : undefined
      const cameraStream = cameraStreamId ? streams[cameraStreamId] : undefined

      const cameraObj: VideoProps = {
        stream: cameraStream,
        currentUser: userInfo,
        streamType: 'camera',
        isAudioEnabled,
        isVideoEnabled,
      }

      const screenObj: VideoProps = {
        stream: screenStream,
        currentUser: userInfo,
        streamType: 'screen',
        isAudioEnabled: false,
        isVideoEnabled: true,
      }

      acc.push(cameraObj)

      if (screenStream && isScreenSharing) {
        acc.push(screenObj)
      }

      return acc
    }, [])

  const handleStreamClick = (streamId: string | undefined) => {
    if (!streamId) return
    setIsLocalPinned(false)
    setIsLocalScreenPinned(false)
    setPinnedStreamId(pinnedStreamId === streamId ? null : streamId)
  }

  const handleLocalPreviewClick = () => {
    setPinnedStreamId(null)
    setIsLocalScreenPinned(false)
    setIsLocalPinned(!isLocalPinned)
  }

  const handleLocalScreenClick = () => {
    setPinnedStreamId(null)
    setIsLocalPinned(false)
    setIsLocalScreenPinned(!isLocalScreenPinned)
  }

  const pinnedStream = remoteStreams.find(props => props.stream?.id === pinnedStreamId)
  const unpinnedStreams = remoteStreams.filter(props => props.stream?.id !== pinnedStreamId)

  const renderMainContent = () => {
    if (isLocalPinned) {
      return <div className={`${styles.participant} ${styles.pin}`} onClick={handleLocalPreviewClick}><LocalPreview /></div>
    }
    if (isLocalScreenPinned) {
      return <div className={`${styles.participant} ${styles.pin}`} onClick={handleLocalScreenClick}><LocalScreenShare /></div>
    }
    if (pinnedStream) {
      return <div className={`${styles.participant} ${styles.pin}`} onClick={() => handleStreamClick(pinnedStream.stream?.id)}><RemoteStream {...pinnedStream} /></div>
    }
    return (
      <>
        <div onClick={handleLocalPreviewClick}><LocalPreview /></div>
        {remoteStreams.map((props) => (
          <div key={props.stream?.id} onClick={() => handleStreamClick(props.stream?.id)}>
            <RemoteStream {...props} />
          </div>
        ))}
        <div onClick={handleLocalScreenClick}><LocalScreenShare /></div>
      </>
    )
  }

  const renderParticipantList = () => {
    if (!isLocalPinned && !isLocalScreenPinned && !pinnedStream) return null

    return (
      <div className={styles.participantList}>
        <div className={styles.participantsInfo}>
          Участники ({unpinnedStreams.length + 2})
        </div>
        {!isLocalPinned && <div onClick={handleLocalPreviewClick}><LocalPreview /></div>}
        {unpinnedStreams.map((props) => (
          <div key={props.stream?.id} onClick={() => handleStreamClick(props.stream?.id)}>
            <RemoteStream {...props} />
          </div>
        ))}
        {!isLocalScreenPinned && <div onClick={handleLocalScreenClick}><LocalScreenShare /></div>}
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

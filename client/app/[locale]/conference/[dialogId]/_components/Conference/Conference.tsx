'use client'

import { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@ui/common/Icon'
import { Image } from '@ui/common/Image'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'
import { CallControls } from '../../components/components'
import { useCameraStream, useScreenShareStream } from '../../hooks/useCameraStream'
import { useConference } from '../../web-rtc/context'
import { Participant } from '../../web-rtc/micro-services'

type StreamType = 'local-preview' | 'local-screen' | 'remote';

interface BaseStreamItem {
  id: string;
  type: StreamType;
  component: JSX.Element;
}

interface LocalStreamItem extends BaseStreamItem {
  type: 'local-preview' | 'local-screen';
}

interface RemoteStreamItem extends BaseStreamItem {
  type: 'remote';
  stream: MediaStream;
  participant: Participant;
}

type StreamItem = LocalStreamItem | RemoteStreamItem;
type StreamsRecord = Record<string, StreamItem>;

interface ConferenceProps {
  profile?: UserProfileInfo;
}

interface VideoProps {
  stream?: MediaStream;
  className?: string;
  isVideoEnabled?: boolean,
  isAudioEnabled?: boolean,
  currentUser?: UserInfo
  streamType?: 'screen' | 'camera'
}

export function LocalPreview() {
  const { videoProps, isVideoEnabled, isAudioEnabled, currentUser } = useCameraStream({
    mirror: true,
    onStreamChange: (stream) => {
      console.log('Stream changed:', stream?.getTracks())
    },
  })

  return (
    <div className={styles.participant}>
      {
        isVideoEnabled ? (
          <video
            {...videoProps}
            className={`${styles.video} ${styles.videoMirrored}`}
          />
        ) : (
          <div className={styles.profileImageContainer}>
            <Image className={styles.profileImage} src={currentUser?.profile_image || ''} alt={currentUser?.name || ''} width={125} height={50} />
          </div>
        )
      }
      {isAudioEnabled
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
  const { videoProps, isVideoEnabled } = useScreenShareStream()

  if (!isVideoEnabled) return null
  return (
    <div className={styles.participant}>
      <video
        {...videoProps}
        className={`${styles.video} ${styles.videoMirrored}`}
      />
    </div>
  )
}

export function RemoteStream(props: VideoProps) {
  const { stream, className, isVideoEnabled, isAudioEnabled, currentUser, streamType } = props
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && stream && isVideoEnabled) {
      videoElement.srcObject = stream
      // Добавим обработку ошибок и попытку воспроизведения
      videoElement.play().catch((error) => {
        console.error('Error playing video:', error)
      })

      return () => {
        videoElement.srcObject = null
      }
    }
  }, [stream, isVideoEnabled])

  const videoProps = useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted: true,
  }), [])

  const cameraStream = useMemo(() => {
    const hasVideo = stream?.getTracks().map(track => track.kind).includes('video')
    if (isVideoEnabled && hasVideo) {
      return (
        <video
          {...videoProps}
          key={stream?.id}
          className={`${styles.video} ${className}`}
        />
      )
    }
    return (
      <div className={styles.profileImageContainer}>
        <Image className={styles.profileImage} src={currentUser?.profile_image || ''} alt={currentUser?.name || ''} width={125} height={50} />
      </div>
    )
  }, [className, currentUser, isVideoEnabled, stream, videoProps])

  const screenStream = useMemo(() => (
    <video
      {...videoProps}
      key={stream?.id}
      className={`${styles.video} ${className}`}
    />
  ), [className, stream?.id, videoProps])

  const microphoneElement = useMemo(() => {
    if (isAudioEnabled) {
      return (
        <Icon
          name="microphone"
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            background: 'gray',
          }}
        />
      )
    }
    return (
      <Icon
        name="microphone-off"
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          background: 'gray',
        }}
      />
    )
  }, [isAudioEnabled])

  return (
    <div className={styles.participant}>
      {streamType === 'camera' ? cameraStream : screenStream}
      {streamType === 'camera' ? <span className={styles.participantName}>{currentUser?.name}</span> : null}
      {streamType === 'camera' ? microphoneElement : null}
    </div>
  )
}

export function Conference({ profile }: ConferenceProps) {
  const { isInitialized } = useConference()

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
        <div className={styles.remoteStreams}>
          <LocalPreview />
          <LocalScreenShare />
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

'use client'

import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@ui/common/Icon'
import { Image } from '@ui/common/Image'
import { VideoChatTest } from '../../components/testVideo1'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'
import { CallControls } from '../../components/components'
import { useCameraStream, useScreenShareStream } from '../../hooks/useCameraStream'
import { useConference } from '../../web-rtc/context'

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
  participant: any;
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
  const { videoProps, currentUser, showPlaceholder, localMedia } = useCameraStream({
    mirror: true,
    // onStreamChange: (stream) => {
    //   console.log('Stream changed:', stream?.getTracks())
    // },
  })
  // console.log('showPlaceholder', showPlaceholder)

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

// export function LocalScreenShare() {
//   const { videoProps, isVideoEnabled } = useScreenShareStream()
//
//   if (!isVideoEnabled) return null
//   return (
//     <div className={styles.participant}>
//       <video
//         {...videoProps}
//         className={`${styles.video} ${styles.videoMirrored}`}
//       />
//     </div>
//   )
// }
//
// export function RemoteScreenShare() {
//   const { roomInfo:{ participants } } = useConference()
//
//   // console.clear()
//   const a = participants.find(({ userId }) => userId === '6')?.media
//   const streams = a?.stream
//
//
//
//   const screenRef = useRef<HTMLVideoElement>(null)
//
//   // useEffect(() => {
//   //   const videoElement = screenRef.current
//   //   if (videoElement && screen) {
//   //     videoElement.srcObject = screen
//   //
//   //     return () => {
//   //       videoElement.srcObject = null
//   //     }
//   //   }
//   // }, [screen, isScreenSharing])
//   //
//   // const cameraRef = useRef<HTMLVideoElement>(null)
//   //
//   // useEffect(() => {
//   //   const videoElement = cameraRef.current
//   //   if (videoElement && camera) {
//   //     videoElement.srcObject = camera
//   //
//   //     return () => {
//   //       videoElement.srcObject = null
//   //     }
//   //   }
//   // }, [camera])
//
//   // console.clear()
//   // console.log('user', a)
//   // console.log('streams', streams?.getTracks().filter(track => track.kind === 'audio'))
//
//
//   return (
//     <div className={styles.participant}>
//       <video
//         ref={screenRef}
//         autoPlay
//         playsInline
//         muted
//         className={`${styles.video} ${styles.videoMirrored}`}
//       />
//       <video
//         ref={cameraRef}
//         autoPlay
//         playsInline
//         muted
//         className={`${styles.video} ${styles.videoMirrored}`}
//       />
//     </div>
//   )
// }

export function RemoteStream(props: VideoProps) {
  const {
    stream,
    className,
    isVideoEnabled,
    isAudioEnabled,
    currentUser,
    streamType
  } = props
  const videoRef = useRef<HTMLVideoElement>(null)

  // console.clear()
  console.log('stream', stream)
  console.log('isVideoEnabled', isVideoEnabled)
  console.log('isAudioEnabled', isAudioEnabled)
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
        className={`${styles.video} ${styles.videoMirrored}`}
        style={{ display: !isVideoEnabled ? 'none' : 'block' }}
      />
      {!isVideoEnabled && (
        <div className={styles.profileImageContainer}>
          <Image className={styles.profileImage} src={currentUser?.profile_image || ''} alt={currentUser?.name || ''} width={125} height={50}/>
        </div>
      )}
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

export function Conference({ profile }: ConferenceProps) {
  const {
    isInitialized,
    participants,
    currentUser
  } = useConference()

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
          <LocalPreview/>
          {participants.filter(({ userId }) => userId !== String(currentUser?.id))
            ?.map(({
              userId,
              userInfo,
              media
            }) => {

              const isAudioEnabled = media.isAudioEnabled
              const isVideoEnabled = media.isVideoEnabled
              return (
                <RemoteStream
                  key={userId}
                  stream={media.stream}
                  currentUser={userInfo}
                  streamType={'camera'}
                  isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
              />
            )
          })}
          {/* <LocalScreenShare /> */}
          {/* <RemoteScreenShare /> */}
          {/* <VideoChatTest /> */}
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

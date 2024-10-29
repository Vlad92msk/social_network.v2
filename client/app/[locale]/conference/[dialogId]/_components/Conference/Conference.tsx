'use client'

import { useParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { classNames } from '@utils/others'
import styles from './Conference.module.scss'
import { UserProfileInfo } from '../../../../../../../swagger/profile/interfaces-profile'
import { useConferenceSocketConnect } from '../../_hooks'
import { useWebRTCContext } from '../../_services/ConferenceContext'
import { useWebRTC } from '../../_services/webrtc-utils'
import { ConferenceSelectors } from '../../_store/selectors'

interface ConferenceProps {
  profile?: UserProfileInfo;
}

interface VideoViewProps {
  stream: MediaStream | null;
  muted: boolean;
  isEnabled: boolean;
}

export const VideoView = React.memo(function VideoView({
  stream,
  muted = false,
  isEnabled = true
}: VideoViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && stream) {
      console.log('Setting video stream:', {
        tracks: stream.getTracks().map(track => ({
          kind: track.kind,
          enabled: track.enabled,
          id: track.id,
          muted: track.muted,
          readyState: track.readyState
        }))
      })

      // Создаём новый MediaStream только с нужными треками
      const videoTracks = stream.getVideoTracks()
      if (videoTracks.length > 0) {
        const newStream = new MediaStream([videoTracks[0]])
        videoElement.srcObject = newStream

        // Обработчик состояния трека
        videoTracks[0].onended = () => {
          console.log('Video track ended')
          if (videoElement.srcObject) {
            videoElement.srcObject = null
          }
        }
      }

      const playVideo = async () => {
        try {
          await videoElement.play()
          console.log('Video playback started successfully')
        } catch (error) {
          console.error('Error playing video:', error)
          // Пробуем воспроизвести снова через небольшую задержку
          setTimeout(() => {
            videoElement.play().catch(console.error)
          }, 1000)
        }
      }

      playVideo()
    }

    return () => {
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoElement.srcObject = null
      }
    }
  }, [stream])

  // Обновляем enabled состояние треков
  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = isEnabled
      })
    }
  }, [isEnabled, stream])

  return (
    <div className={styles.videoContainer}>
      {!stream && (
        <div className={styles.noVideoPlaceholder}>
          Нет видео
        </div>
      )}
      {stream && !isEnabled && (
        <div className={styles.videoDisabled}>
          Камера выключена
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{ display: stream && isEnabled ? 'block' : 'none' }}
      />
    </div>
  )
})

export function Conference({ profile }: ConferenceProps) {
  const dispatch = useDispatch()
  const { dialogId } = useParams<{ dialogId: string }>()
  useConferenceSocketConnect({ conferenceId: dialogId })

  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)
  const participants = useSelector(ConferenceSelectors.selectUsers)
  const { getStream } = useWebRTCContext()

  const {
    toggleVideo,
    toggleAudio,
    cleanup,
    isVideoEnabled,
    isAudioEnabled,
  } = useWebRTC()

  useEffect(() => () => {
    cleanup()
  }, [cleanup])

  const handleToggleVideo = useCallback(() => {
    toggleVideo()
  }, [toggleVideo])

  const handleToggleAudio = useCallback(() => {
    toggleAudio()
  }, [toggleAudio])

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
          <VideoView
            stream={getStream('local')}
            muted
            isEnabled={isVideoEnabled}
          />
          <span className={styles.participantName}>
            {profile?.user_info.id}
            {' '}
            (You)
          </span>
        </div>

        {participants
          .filter((id) => id !== String(profile?.user_info.id))
          .map((participantId) => (
            <div key={participantId} className={styles.participant}>
              <VideoView
                stream={getStream(participantId)}
                muted={false}
                isEnabled
              />
              <span className={styles.participantName}>
                User
                {' '}
                {participantId}
              </span>
            </div>
          ))}
      </div>

      <div className={styles.actionsContainer}>
        <div className={styles.mediaControls}>
          <button
            onClick={handleToggleVideo}
            className={classNames(styles.controlButton, {
              [styles.disabled]: !isVideoEnabled,
            })}
          >
            {isVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
          </button>
          <button
            onClick={handleToggleAudio}
            className={classNames(styles.controlButton, {
              [styles.disabled]: !isAudioEnabled,
            })}
          >
            {isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          </button>
        </div>
      </div>
    </div>
  )
}

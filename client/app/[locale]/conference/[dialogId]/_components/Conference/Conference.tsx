'use client'

import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@ui/common/Icon'
import { Image } from '@ui/common/Image'
import { classNames } from '@utils/others'
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
  onClick?: VoidFunction
}

export function useAudioAnalyzer(stream?: MediaStream | null) {
  const [volume, setVolume] = useState(0)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number>(0)
  const lastVolumeRef = useRef(0)

  // Функция для запуска AudioContext
  const resumeAudioContext = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }

  useEffect(() => {
    if (audioContextRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      audioContextRef.current.close()
      analyzerRef.current = null
      audioContextRef.current = null
    }

    // Проверяем наличие аудио трека
    if (!stream?.getAudioTracks().length) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()

      // Пробуем запустить контекст
      resumeAudioContext().then(() => {
        const analyzer = audioContextRef.current!.createAnalyser()
        analyzer.fftSize = 256
        analyzerRef.current = analyzer

        const microphone = audioContextRef.current!.createMediaStreamSource(stream)
        microphone.connect(analyzer)

        const dataArray = new Uint8Array(analyzer.frequencyBinCount)

        const analyze = () => {
          if (!analyzerRef.current) return

          analyzerRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
          const roundedVolume = Math.round(average)

          const THRESHOLD = 5
          if (Math.abs(roundedVolume - lastVolumeRef.current) > THRESHOLD) {
            setVolume(roundedVolume)
            lastVolumeRef.current = roundedVolume
          }

          animationFrameRef.current = requestAnimationFrame(analyze)
        }

        analyze()
      })
    }

    return () => {
      if (audioContextRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        audioContextRef.current.close()
        analyzerRef.current = null
        audioContextRef.current = null
      }
    }
  }, [stream])

  return { volume, resumeAudioContext }
}

function Mic({ stream, isMicActive }: {stream?: MediaStream | null, isMicActive?: boolean }) {
  const { volume, resumeAudioContext } = useAudioAnalyzer(stream)
  const isSpeaking = volume > 10

  // При первом рендере добавляем обработчик
  useEffect(() => {
    const handleFirstInteraction = () => {
      resumeAudioContext()
      // Удаляем обработчик после первого использования
      document.removeEventListener('click', handleFirstInteraction)
    }

    document.addEventListener('click', handleFirstInteraction)
    return () => document.removeEventListener('click', handleFirstInteraction)
  }, [resumeAudioContext])

  return (
    <div className={styles.micContainer}>
      <Icon
        name="microphone-off"
        className={`${styles.micIcon} ${isMicActive ? styles.hidden : ''}`}
      />
      {/* <Icon */}
      {/*   name="microphone" */}
      {/*   className={`${styles.micIcon} ${!isMicActive || isSpeaking ? styles.hidden : ''}`} */}
      {/* /> */}
      <div className={`${styles.AudioLine} ${isSpeaking && isMicActive ? styles.active : styles.inactive}`}>
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

export function LocalPreview({ className, onClick }: { className?: string, onClick?: VoidFunction }) {
  const { videoProps,
    currentUser,
    showPlaceholder, localMedia } = useCameraStream({
    mirror: true,
  })

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
      <Mic isMicActive={isActiveMicrophone} stream={localMedia.stream} />
    </div>
  )
}

export function LocalScreenShare({ className, onClick }: { className?: string, onClick?: VoidFunction }) {
  const {
    videoProps,
    isVideoEnabled,
  } = useScreenShareStream()

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
    isAudioEnabled,
    currentUser,
    streamType,
    onClick,
  } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const hasVideo = (stream?.getVideoTracks().length || 0) > 0
  const hasAudio = (stream?.getAudioTracks().length || 0) > 0

  useEffect(() => {
    if (!stream) return

    // Обновляем видео поток
    if (hasVideo && videoRef.current && stream !== videoRef.current.srcObject) {
      videoRef.current.srcObject = null
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error)
      }
    }

    // Обновляем аудио поток
    if (hasAudio && !hasVideo && audioRef.current && stream !== audioRef.current.srcObject) {
      audioRef.current.srcObject = null
      audioRef.current.srcObject = stream
      audioRef.current.onloadedmetadata = () => {
        audioRef.current?.play().catch(console.error)
      }
    }
  }, [stream, hasVideo, hasAudio])

  const mediaProps = useMemo(() => ({
    autoPlay: true,
    playsInline: true,
    muted: true,
  }), [])

  return (
    <div className={classNames(styles.participant, className)} onClick={onClick}>
      {/* Видео элемент создаем только если есть видеотрек */}
      {hasVideo && (
        <video
          ref={videoRef}
          {...mediaProps}
          style={{ display: !isVideoEnabled ? 'none' : 'block' }}
        />
      )}

      {/* Аудио элемент создаем только если есть аудиотрек и нет видеотрека */}
      {hasAudio && !hasVideo && (
        <audio ref={audioRef} {...mediaProps} />
      )}

      {!isVideoEnabled && (
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
        <Mic isMicActive={isAudioEnabled} stream={stream} />
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
      <>
        <LocalPreview onClick={handleLocalPreviewClick} />
        {remoteStreams.map((props) => (
          <RemoteStream key={props.stream?.id} onClick={() => handleStreamClick(props.stream?.id)} {...props} />
        ))}
        <LocalScreenShare onClick={handleLocalScreenClick} />
      </>
    )
  }

  const renderParticipantList = () => {
    if (!isLocalPinned && !isLocalScreenPinned && !pinnedStream) return null

    return (
      <div className={styles.participantList}>
        <div className={styles.participantsInfo}>
          Участники (
          {unpinnedStreams.length +1}
          )
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

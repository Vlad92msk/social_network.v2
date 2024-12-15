import { useEffect, useMemo, useRef, useState } from 'react'
import { useConference } from '../context'

export function useCameraStream(options?: {
  enabled?: boolean;
  mirror?: boolean;
  onStreamChange?: (stream: MediaStream | null) => void;
}) {
  const { localMedia, currentUser } = useConference()
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setShowPlaceholder(!localMedia.stream || !localMedia.hasVideo || localMedia.isVideoMuted)
  }, [localMedia.hasVideo, localMedia.isVideoMuted, localMedia.stream])

  useEffect(() => {
    if (videoRef.current) {
      const stream = localMedia?.stream

      if (stream && stream !== videoRef.current.srcObject) {
        videoRef.current.srcObject = null // Сначала очищаем
        videoRef.current.srcObject = stream // Затем устанавливаем новый поток

        options?.onStreamChange?.(stream)
        // Дожидаемся загрузки метаданных перед воспроизведением
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error)
        }
      }
    }
  }, [localMedia?.stream, options])

  const videoProps = useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted: true, // Всегда мьютим локальное видео
  }), [])

  return { videoProps, currentUser, localMedia, showPlaceholder }
}

export function useScreenShareStream() {
  const {
    screenShare: { stream, isVideoEnabled },
    currentUser,
  } = useConference()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && stream) {
      videoElement.srcObject = stream

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
  // console.log('useScreenShareStream', stream?.getTracks())
  return { videoProps, isVideoEnabled, currentUser }
}

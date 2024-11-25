import { useEffect, useMemo, useRef } from 'react'
import { useConference } from '../web-rtc/context'

export function useCameraStream(options?: {
  enabled?: boolean;
  mirror?: boolean;
  onStreamChange?: (stream: MediaStream | null) => void;
}) {
  const {
    localMedia: { stream, isVideoEnabled, isAudioEnabled },
    currentUser,
  } = useConference()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && stream && options?.enabled !== false) {
      videoElement.srcObject = stream
      options?.onStreamChange?.(stream)

      return () => {
        videoElement.srcObject = null
        options?.onStreamChange?.(null)
      }
    }
  }, [stream, isVideoEnabled, isAudioEnabled, options])

  const videoProps = useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted: true, // Всегда мьютим локальное видео
    style: {
      transform: options?.mirror ? 'scaleX(-1)' : undefined,
    } as const,
  }), [options?.mirror])

  return { videoProps, isAudioEnabled, isVideoEnabled, currentUser }
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

  return { videoProps, isVideoEnabled, currentUser }
}

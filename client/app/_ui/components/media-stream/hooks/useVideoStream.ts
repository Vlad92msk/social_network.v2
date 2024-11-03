// Вспомогательный хук для видео элемента
import { useEffect, useMemo, useRef } from 'react'
import { useMediaStreamContext } from '../context/MediaStreamContext'

export function useVideoStream(options?: {
  enabled?: boolean;
  mirror?: boolean;
  onStreamChange?: (stream: MediaStream | null) => void;
}) {
  const { stream } = useMediaStreamContext()
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
  }, [stream, options?.enabled, options?.onStreamChange])

  const videoProps = useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    style: {
      transform: options?.mirror ? 'scaleX(-1)' : undefined,
    } as const,
  }), [options?.mirror])

  return videoProps
}

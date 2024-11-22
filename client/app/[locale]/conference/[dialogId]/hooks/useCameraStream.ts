import { useEffect, useMemo, useRef } from 'react'
import { useConference } from '../web-rtc/context'

export function useCameraStream(options?: {
  enabled?: boolean;
  mirror?: boolean;
  onStreamChange?: (stream: MediaStream | null) => void;
}) {
  const { media: { stream } } = useConference()
  const videoRef = useRef<HTMLVideoElement>(null)

  // console.log('localstream', stream)
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
  }, [stream, options?.enabled, options])

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

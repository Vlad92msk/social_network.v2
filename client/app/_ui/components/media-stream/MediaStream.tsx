import React, { createContext, useContext } from 'react'
import { useMediaStream1 } from './useMediaStream'

const MediaStreamContext = createContext<ReturnType<typeof useMediaStream1> | null>(null)

interface MediaStreamProviderProps {
  children: React.ReactNode
  options?: Parameters<typeof useMediaStream1>[0]
  autoStart?: boolean
}

export function MediaStreamProvider({ children, options, autoStart = true }: MediaStreamProviderProps) {
  const streamControl = useMediaStream1(options)

  // Автостарт стрима если нужно
  React.useEffect(() => {
    if (autoStart) {
      streamControl.startStream()
    }
  }, [autoStart])

  return (
    <MediaStreamContext.Provider value={streamControl}>
      {children}
    </MediaStreamContext.Provider>
  )
}

// Хук для получения контекста
export function useMediaStreamContext() {
  const context = useContext(MediaStreamContext)
  if (!context) {
    throw new Error('useMediaStreamContext must be used within MediaStreamProvider')
  }
  return context
}

// Вспомогательный хук для видео элемента
export function useVideoStream(options?: {
  enabled?: boolean;
  mirror?: boolean;
  onStreamChange?: (stream: MediaStream | null) => void;
}) {
  const { stream } = useMediaStreamContext()
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
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

  const videoProps = React.useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    style: {
      transform: options?.mirror ? 'scaleX(-1)' : undefined,
    } as const,
  }), [options?.mirror])

  return videoProps
}

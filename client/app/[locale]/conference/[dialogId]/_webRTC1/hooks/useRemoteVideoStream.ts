import React from 'react'

export interface RemoteVideoOptions {
  stream: MediaStream | null | undefined
  enabled?: boolean
  mirror?: boolean
  muted?: boolean
  volume?: number
  onStreamChange?: (stream: MediaStream | undefined) => void
  autoPlay?: boolean
}

export function useRemoteVideoStream(options: RemoteVideoOptions) {
  const {
    stream,
    enabled = true,
    mirror = false,
    muted = false,
    volume = 1,
    onStreamChange,
  } = options

  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && stream && enabled) {
      videoElement.srcObject = stream
      videoElement.volume = volume

      // Уведомляем о подключении потока
      onStreamChange?.(stream)

      // Обработчики событий
      const handlePause = () => {
        if (videoElement.paused) {
          videoElement.play().catch(console.error)
        }
      }

      const handleVolumeChange = () => {
        if (videoElement.volume !== volume) {
          videoElement.volume = volume
        }
      }

      videoElement.addEventListener('pause', handlePause)
      videoElement.addEventListener('volumechange', handleVolumeChange)

      return () => {
        videoElement.removeEventListener('pause', handlePause)
        videoElement.removeEventListener('volumechange', handleVolumeChange)
        videoElement.srcObject = null
        onStreamChange?.(undefined)
      }
    }
  }, [stream, enabled, volume, onStreamChange])

  const videoProps = React.useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted,
    style: {
      transform: mirror ? 'scaleX(-1)' : undefined,
    } as const,
    // Добавляем обработчики ошибок воспроизведения
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => {
      e.currentTarget.play().catch(console.error)
    },
    onError: (e: React.SyntheticEvent<HTMLVideoElement>) => {
      console.error('Video playback error:', e)
    },
  }), [mirror, muted])

  return videoProps
}

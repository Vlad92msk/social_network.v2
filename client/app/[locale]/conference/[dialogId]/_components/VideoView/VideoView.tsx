'use client'

import { useEffect, useRef } from 'react'

interface VideoViewProps {
  stream: MediaStream | null
  muted?: boolean
  isEnabled?: boolean
}

export function VideoView({ stream, muted = false, isEnabled = true }: VideoViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previousStream = useRef<MediaStream | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !stream) return

    // Обновляем srcObject только если поток изменился
    if (previousStream.current !== stream) {
      videoElement.srcObject = stream
      previousStream.current = stream

      // Воспроизводим видео только при первой установке потока
      const playPromise = videoElement.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Playback was prevented:', error)
        })
      }
    }

    return () => {
      if (videoElement.srcObject) {
        videoElement.srcObject = null
      }
      previousStream.current = null
    }
  }, [stream])

  if (!stream) {
    return <div>No video stream available</div>
  }

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
      />
      {!isEnabled && (
        <div>
          <span>Видео выключено</span>
        </div>
      )}
    </div>
  )
}

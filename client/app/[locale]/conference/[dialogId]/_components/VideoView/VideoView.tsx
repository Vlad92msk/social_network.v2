'use client'

import { useEffect, useRef } from 'react'

interface VideoViewProps {
  stream: MediaStream | undefined;
  muted: boolean;
  isEnabled: boolean;
}

export function VideoView({ stream, muted, isEnabled }: VideoViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previousStream = useRef<MediaStream | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !stream) return

    // Обновляем srcObject только если поток изменился
    if (previousStream.current !== stream) {
      videoElement.srcObject = stream
      previousStream.current = stream

      const playPromise = videoElement.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Playback was prevented:', error)
        })
      }
    }

    return () => {
      if (videoElement.srcObject) {
        videoElement.srcObject = null
      }
    }
  }, [stream])

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
      />
      {!stream && (
        <div>
          No video available
        </div>
      )}
      {!isEnabled && (
        <div>
          Video disabled
        </div>
      )}
    </div>
  )
}

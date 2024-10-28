'use client'

import { useEffect, useRef } from 'react'

interface VideoViewProps {
  stream: MediaStream | undefined;
  muted: boolean;
  isEnabled: boolean;
}

export function VideoView({ stream, muted = false, isEnabled }: VideoViewProps) {
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

    // Включаем/выключаем видеодорожки
    stream.getVideoTracks().forEach((track) => {
      track.enabled = isEnabled
    })

    return () => {
      if (videoElement.srcObject) {
        videoElement.srcObject = null
      }
      previousStream.current = null
    }
  }, [stream, isEnabled])

  if (!stream) {
    return null
    // return <div>No video stream available</div>
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
      />
      {/* {!isEnabled && ( */}
      {/*   <div className="absolute inset-0 flex items-center justify-center bg-gray-900"> */}
      {/*     <span className="text-white">Video disabled</span> */}
      {/*   </div> */}
      {/* )} */}
    </div>
  )
}

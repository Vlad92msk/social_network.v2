// VideoView.tsx
import React, { useEffect, useRef, useState } from 'react'

interface VideoViewProps {
  stream?: MediaStream;
  isEnabled?: boolean;
  muted?: boolean;
  className?: string;
}

export function VideoView(props: VideoViewProps) {
  const {
    stream,
    isEnabled = true,
    muted = false,
    className,
  } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoActive, setIsVideoActive] = useState(false)

  // Подключение потока к видео элементу
  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && stream) {
      videoElement.srcObject = stream
      // Обработка ошибок воспроизведения
      const playVideo = async () => {
        try {
          await videoElement.play()
        } catch (error) {
          console.error('Error playing video:', error)
        }
      }
      playVideo()
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null
      }
    }
  }, [stream])

  // Отслеживание активности треков
  useEffect(() => {
    if (!stream) {
      setIsVideoActive(false)
      return
    }

    const updateTrackStates = () => {
      const audioTrack = stream.getAudioTracks()[0]
      const videoTrack = stream.getVideoTracks()[0]

      setIsVideoActive(videoTrack?.enabled ?? false)
    }

    // Начальное состояние
    updateTrackStates()

    // Подписка на изменения треков
    stream.addEventListener('addtrack', updateTrackStates)
    stream.addEventListener('removetrack', updateTrackStates)

    return () => {
      stream.removeEventListener('addtrack', updateTrackStates)
      stream.removeEventListener('removetrack', updateTrackStates)
    }
  }, [stream])

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-900 ${className}`}>
      {/* Видео */}
      <video
        ref={videoRef}
        className={`h-full w-full object-cover ${!isEnabled || !isVideoActive ? 'hidden' : ''}`}
        muted={muted}
        playsInline
        autoPlay
      />

      {/* Оверлей для отображения ошибок или дополнительной информации */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <span className="text-sm text-gray-400">Нет сигнала</span>
        </div>
      )}
    </div>
  )
}

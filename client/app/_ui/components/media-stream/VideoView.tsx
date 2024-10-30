import { useRef } from 'react'
import { useMediaStream1 } from './useMediaStream'

export function VideoComponent() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    error,
  } = useMediaStream1(videoRef, {
    video: true,
    audio: true,
    videoConstraints: {
      width: 1280,
      height: 720,
    },
  })

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <button onClick={toggleVideo}>
        {isVideoEnabled ? 'Выключить видео' : 'Включить видео'}
      </button>
      <button onClick={toggleAudio}>
        {isAudioEnabled ? 'Выключить звук' : 'Включить звук'}
      </button>
      {error && (
      <div>
        Error:
        {error.message}
      </div>
      )}
    </div>
  )
}

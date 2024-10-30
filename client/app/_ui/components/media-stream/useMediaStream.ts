import { useEffect, useRef, useState } from 'react'

interface MediaStreamOptions {
  audio?: boolean
  video?: boolean
  videoConstraints?: MediaTrackConstraints
  audioConstraints?: MediaTrackConstraints
}

interface MediaStreamControl {
  stream: MediaStream | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  toggleVideo: () => Promise<void>
  toggleAudio: VoidFunction
  startStream: () => Promise<void>
  stopStream: VoidFunction
  error: Error | null
}

export const useMediaStream1 = (options: MediaStreamOptions = { audio: true, video: true }): MediaStreamControl => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(!!options.video)
  const [isAudioEnabled, setIsAudioEnabled] = useState(!!options.audio)

  // Сохраняем последние использованные constraints
  const constraintsRef = useRef({
    video: options.video && {
      ...options.videoConstraints,
    },
    audio: options.audio && {
      ...options.audioConstraints,
    },
  })

  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraintsRef.current)
      setStream(mediaStream)
      setIsVideoEnabled(true)
      setIsAudioEnabled(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get media stream'))
      setStream(null)
    }
  }

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsVideoEnabled(false)
      setIsAudioEnabled(false)
    }
  }

  const toggleVideo = async () => {
    try {
      if (!stream) {
        // Если потока нет - создаём новый
        await startStream()
        return
      }

      const videoTrack = stream.getVideoTracks()[0]

      if (videoTrack) {
        // Если трек есть - просто переключаем его
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      } else if (!videoTrack && constraintsRef.current.video) {
        // Если трека нет, но видео разрешено - получаем новый видеопоток
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: constraintsRef.current.video,
        })

        const newVideoTrack = newVideoStream.getVideoTracks()[0]
        stream.addTrack(newVideoTrack)
        setIsVideoEnabled(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to toggle video'))
    }
  }

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  // Автоматическая очистка при размонтировании
  useEffect(() => () => {
    stopStream()
  }, [])

  return {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    startStream,
    stopStream,
    error,
  }
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_MEDIA_STATE = {
  stream: undefined as unknown as MediaStream,
  isVideoEnabled: false,
  isAudioEnabled: false,
  isScreenSharing: false,
}

export function useMediaStream() {
  const [mediaState, setMediaState] = useState(DEFAULT_MEDIA_STATE)
  const streamInitialized = useRef(false)

  const initializeMedia = useCallback(async () => {
    if (streamInitialized.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // По умолчанию выключаем видео и аудио
      stream.getVideoTracks().forEach((track) => track.enabled = false)
      stream.getAudioTracks().forEach((track) => track.enabled = false)

      streamInitialized.current = true

      setMediaState((prev) => ({
        ...prev,
        stream,
        isVideoEnabled: false,
        isAudioEnabled: false,
      }))
    } catch (error) {
      console.error('Error accessing media devices:', error)
      setMediaState((prev) => ({
        ...prev,
        isVideoEnabled: false,
        isAudioEnabled: false,
      }))
    }
  }, [])

  useEffect(() => {
    initializeMedia()
    return () => {
      if (mediaState.stream) {
        mediaState.stream.getTracks().forEach((track) => track.stop())
      }
      streamInitialized.current = false
    }
  }, [])

  return {
    ...mediaState,
    toggleVideo: useCallback(() => {
      if (!mediaState.stream) return

      const videoTrack = mediaState.stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setMediaState((prev) => ({
          ...prev,
          isVideoEnabled: videoTrack.enabled,
        }))
      }
    }, [mediaState.stream]),

    toggleAudio: useCallback(() => {
      if (!mediaState.stream) return

      const audioTrack = mediaState.stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setMediaState((prev) => ({
          ...prev,
          isAudioEnabled: audioTrack.enabled,
        }))
      }
    }, [mediaState.stream]),
  }
}

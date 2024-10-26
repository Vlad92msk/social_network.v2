'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MediaStreamState } from '../types/media'

const DEFAULT_MEDIA_STATE: MediaStreamState = {
  stream: null,
  isVideoEnabled: false,
  isAudioEnabled: true,
  isScreenSharing: false,
}

export const useMediaStream = () => {
  const [mediaState, setMediaState] = useState<MediaStreamState>(DEFAULT_MEDIA_STATE)
  const streamInitialized = useRef(false)

  const initializeMedia = useCallback(async () => {
    if (streamInitialized.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      streamInitialized.current = true

      setMediaState((prev) => ({
        ...prev,
        stream,
        isVideoEnabled: true,
        isAudioEnabled: true,
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

  const toggleVideo = useCallback(() => {
    if (!mediaState.stream) return

    const videoTrack = mediaState.stream.getVideoTracks()[0]
    if (videoTrack) {
      const newEnabled = !videoTrack.enabled
      videoTrack.enabled = newEnabled

      setMediaState((prev) => ({
        ...prev,
        isVideoEnabled: newEnabled,
      }))

      console.log('Toggle video:', videoTrack.enabled)
    }
  }, [mediaState])

  const toggleAudio = useCallback(() => {
    if (!mediaState.stream) return

    const audioTrack = mediaState.stream.getAudioTracks()[0]
    if (audioTrack) {
      const newEnabled = !audioTrack.enabled
      audioTrack.enabled = newEnabled

      setMediaState((prev) => ({
        ...prev,
        isAudioEnabled: newEnabled,
      }))

      console.log('Toggle audio:', audioTrack.enabled)
    }
  }, [mediaState])

  const cleanup = useCallback(() => {
    if (mediaState.stream) {
      mediaState.stream.getTracks().forEach((track) => {
        track.stop()
      })
      streamInitialized.current = false
      setMediaState(DEFAULT_MEDIA_STATE)
    }
  }, [mediaState.stream])

  useEffect(() => {
    initializeMedia()
    return () => cleanup()
  }, [])

  return {
    ...mediaState,
    toggleVideo,
    toggleAudio,
  }
}

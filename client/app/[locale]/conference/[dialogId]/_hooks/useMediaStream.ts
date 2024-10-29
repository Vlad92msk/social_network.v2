'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_MEDIA_STATE = {
  stream: undefined as unknown as MediaStream,
  isVideoEnabled: false,
  isAudioEnabled: false,
  isScreenSharing: false,
}

export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)

  useEffect(() => {
    async function setupMediaStream() {
      try {
        // Сначала проверяем доступность устройств
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasVideo = devices.some((device) => device.kind === 'videoinput')
        const hasAudio = devices.some((device) => device.kind === 'audioinput')

        console.log('Available devices:', {
          hasVideo,
          hasAudio,
          devices: devices.map((d) => ({
            kind: d.kind,
            label: d.label,
          })),
        })

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: hasVideo ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          } : false,
          audio: hasAudio,
        })

        console.log('Media stream obtained successfully')
        setStream(mediaStream)
      } catch (error) {
        console.error('Error accessing media devices:', error)
      }
    }

    setupMediaStream()

    return () => {
      if (stream) {
        console.log('Stopping all tracks')
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }, [stream])

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }, [stream])

  return {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  }
}

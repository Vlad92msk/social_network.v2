'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

interface RemoteVideoProps {
  stream?: MediaStream;
  className?: string;
  enabled?: boolean;
  onStreamChange?: (stream: MediaStream | undefined) => void;
}

export const RemoteVideo: React.FC<RemoteVideoProps> = ({
  className,
  stream,
  enabled = true,
  onStreamChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [connectionState, setConnectionState] = useState<string>('initializing')
  const retryTimeoutRef = useRef<NodeJS.Timeout>()

  const stableOnStreamChange = useRef(onStreamChange)
  useEffect(() => {
    stableOnStreamChange.current = onStreamChange
  }, [onStreamChange])

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) {
      console.warn('Video element not found')
      return
    }

    let mounted = true
    let playAttempts = 0
    const MAX_PLAY_ATTEMPTS = 3

    const attemptPlay = async () => {
      if (!mounted || !videoElement || !stream) return

      if (playAttempts >= MAX_PLAY_ATTEMPTS) {
        console.warn('Max play attempts reached')
        return
      }

      try {
        playAttempts++
        await videoElement.play()
        console.log('Play attempt succeeded')
        setIsPlaying(true)
      } catch (error) {
        console.warn(`Play attempt ${playAttempts} failed:`, error)
        if (mounted && playAttempts < MAX_PLAY_ATTEMPTS) {
          retryTimeoutRef.current = setTimeout(attemptPlay, 1000)
        }
      }
    }

    if (stream && enabled) {
      console.log('Stream setup:', {
        streamId: stream.id,
        streamActive: stream.active,
        tracks: stream.getTracks().map(track => ({
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        }))
      })

      try {
        // Отслеживаем состояние трека
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            console.log('Video track ended')
            setConnectionState('track ended')
          })

          videoTrack.addEventListener('mute', () => {
            console.log('Video track muted')
            setConnectionState('track muted')
          })

          videoTrack.addEventListener('unmute', () => {
            console.log('Video track unmuted')
            setConnectionState('track unmuted')
          })
        }

        const handlers: Record<string, EventListener> = {
          loadstart: () => {
            console.log('loadstart event')
            setConnectionState('loading')
          },
          loadedmetadata: () => {
            console.log('loadedmetadata event')
            setConnectionState('metadata loaded')
            attemptPlay()
          },
          playing: () => {
            console.log('playing event', {
              currentTime: videoElement.currentTime,
              videoWidth: videoElement.videoWidth,
              videoHeight: videoElement.videoHeight
            })
            setIsPlaying(true)
            setConnectionState('playing')
          },
          waiting: () => {
            console.log('waiting event')
            setConnectionState('waiting')
            setIsPlaying(false)
          },
          error: () => {
            const error = videoElement.error
            console.error('Video error:', error)
            setConnectionState(`error: ${error?.message}`)
            setIsPlaying(false)
          }
        }

        // Регистрируем обработчики
        Object.entries(handlers).forEach(([event, handler]) => {
          videoElement.addEventListener(event, handler)
        })

        // Устанавливаем srcObject и пробуем воспроизвести
        videoElement.srcObject = stream
        stableOnStreamChange.current?.(stream)
        attemptPlay()

        return () => {
          mounted = false
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
          }

          // Очищаем обработчики
          Object.entries(handlers).forEach(([event, handler]) => {
            videoElement.removeEventListener(event, handler)
          })

          const track = stream.getVideoTracks()[0]
          if (track) {
            //@ts-ignore
            track.removeAllListeners?.()
          }

          console.log('Cleanup: removing stream')
          videoElement.srcObject = null
          stableOnStreamChange.current?.(undefined)
          setIsPlaying(false)
          setConnectionState('cleaned up')
        }
      } catch (error) {
        console.error('Setup error:', error)
        setConnectionState(`setup error: ${error}`)
      }
    } else {
      console.log('No stream or disabled:', { hasStream: !!stream, enabled })
      videoElement.srcObject = null
      stableOnStreamChange.current?.(undefined)
      setIsPlaying(false)
      setConnectionState('no stream')
    }

    return () => {
      mounted = false
    }
  }, [stream?.id, enabled])

  const videoProps = useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted: true,
  }), [])

  return (
    <div className={`relative ${className}`}>
      <video {...videoProps} className="w-full h-full object-cover" />
      {!isPlaying && stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div>Загрузка видео...</div>
            <div className="text-sm opacity-75">{connectionState}</div>
          </div>
        </div>
      )}
    </div>
  )
}

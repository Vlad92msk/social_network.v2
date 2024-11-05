import { useCallback, useState } from 'react'
import { WebRTCSignal } from '../types/media'

interface UseScreenShareProps {
  sendSignal: (targetUserId: string, signal: WebRTCSignal) => void
  participants: string[]
}

export function useScreenShare({ sendSignal, participants }: UseScreenShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)

  const stopScreenSharing = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop())
      setScreenStream(null)
    }

    setIsSharing(false)

    participants.forEach((participantId) => {
      sendSignal(participantId, {
        type: 'screen-share',
        action: 'stop',
      })
    })
  }, [screenStream, participants, sendSignal])

  const startScreenSharing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // Используем только стандартные свойства
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      })

      setScreenStream(stream)
      setIsSharing(true)

      // Слушаем событие остановки шаринга
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing()
      }

      // Уведомляем всех участников
      participants.forEach((participantId) => {
        sendSignal(participantId, {
          type: 'screen-share',
          action: 'start',
          stream,
        })
      })
    } catch (error) {
      console.error('Failed to start screen sharing:', error)
      setIsSharing(false)
    }
  }, [participants, sendSignal, stopScreenSharing])

  return {
    isSharing,
    screenStream,
    startScreenSharing,
    stopScreenSharing,
  }
}

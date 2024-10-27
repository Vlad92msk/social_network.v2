// hooks/useConferenceControls.ts

import { useRouter } from 'next/router'
import { useCallback, useRef } from 'react'
import { WebRTCSignal } from '../types/media'

interface UseConferenceControlsProps {
  sendSignal: (targetUserId: string, signal: WebRTCSignal) => void;
  participants: string[];
  currentUserId: string;
  onCleanup?: () => void;
}

export function useConferenceControls({
  sendSignal,
  participants,
  currentUserId,
  onCleanup,
}: UseConferenceControlsProps) {
  const router = useRouter()
  const recordingStream = useRef<MediaRecorder | null>(null)

  const leaveConference = useCallback(() => {
    participants.forEach((participantId) => {
      sendSignal(participantId, {
        type: 'user-action',
        action: 'leave',
        userId: currentUserId,
      })
    })

    if (onCleanup) {
      onCleanup()
    }

    router.push('/dashboard')
  }, [participants, currentUserId, sendSignal, onCleanup, router])

  const raiseHand = useCallback(() => {
    participants.forEach((participantId) => {
      sendSignal(participantId, {
        type: 'user-action',
        action: 'raise-hand',
        userId: currentUserId,
        timestamp: Date.now(),
      })
    })
  }, [participants, currentUserId, sendSignal])

  const changeLayout = useCallback((layout: 'grid' | 'presentation' | 'focus') => {
    participants.forEach((participantId) => {
      sendSignal(participantId, {
        type: 'room-action',
        action: 'change-layout',
        layout,
      })
    })
  }, [participants, sendSignal])

  const toggleRecording = useCallback(async (start: boolean) => {
    if (start && !recordingStream.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        const recorder = new MediaRecorder(stream)
        const chunks: BlobPart[] = []

        recorder.ondataavailable = (e) => chunks.push(e.data)
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `conference-${Date.now()}.webm`
          a.click()
        }

        recorder.start()
        recordingStream.current = recorder

        participants.forEach((participantId) => {
          sendSignal(participantId, {
            type: 'room-action',
            action: 'start-recording',
            timestamp: Date.now(),
          })
        })
      } catch (error) {
        console.error('Failed to start recording:', error)
      }
    } else if (!start && recordingStream.current) {
      recordingStream.current.stop()
      recordingStream.current = null

      participants.forEach((participantId) => {
        sendSignal(participantId, {
          type: 'room-action',
          action: 'stop-recording',
          timestamp: Date.now(),
        })
      })
    }
  }, [participants, sendSignal])

  return {
    leaveConference,
    raiseHand,
    changeLayout,
    toggleRecording,
  }
}

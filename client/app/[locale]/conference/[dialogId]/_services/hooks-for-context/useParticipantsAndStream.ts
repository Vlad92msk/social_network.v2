import { debounce } from 'lodash'
import { useEffect } from 'react'
import { WebRTCManager } from '../webrtc.service'

// Хук для управления участниками и медиапотоком
export function useParticipantsAndStream(
  webRTCManager: WebRTCManager,
  participants: string[],
  localStream?: MediaStream,
) {
  useEffect(() => {
    if (!webRTCManager) return

    const debouncedUpdate = debounce(() => {
      if (participants.length > 0) {
        webRTCManager.updateParticipants(participants)
      }
    }, 300)

    if (localStream) {
      webRTCManager.setLocalStream(localStream)
    }

    debouncedUpdate()

    return () => {
      debouncedUpdate.cancel()
    }
  }, [webRTCManager, localStream, participants])
}

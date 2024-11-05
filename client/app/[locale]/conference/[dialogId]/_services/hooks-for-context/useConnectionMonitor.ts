import { useEffect } from 'react'
import { WebRTCStateChangeType } from '../types'
import { WebRTCManager } from '../webrtc.service'

// Хук для мониторинга соединений
export function useConnectionMonitor(
  webRTCManager: WebRTCManager,
  participants: string[],
  currentUserId: string,
) {
  useEffect(() => {
    if (!webRTCManager) return

    const checkConnections = () => {
      const currentState = webRTCManager.getState()

      participants.forEach((participantId) => {
        if (participantId !== currentUserId) {
          const status = currentState[WebRTCStateChangeType.CONNECTION].connectionStatus[participantId]
          const stream = currentState[WebRTCStateChangeType.STREAM].streams[participantId]

          if (status === 'connected' && !stream) {
            console.log(
              `Обнаружено подключенное состояние без потока для участника с ID ${participantId}, перезапрашиваем`,
            )
            webRTCManager.refreshConnection(participantId)
          }
        }
      })
    }

    let animationFrameId: number
    let lastCheck = 0
    const INTERVAL = 2000

    const tick = () => {
      const now = Date.now()
      if (now - lastCheck >= INTERVAL) {
        checkConnections()
        lastCheck = now
      }
      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [webRTCManager, participants, currentUserId])
}

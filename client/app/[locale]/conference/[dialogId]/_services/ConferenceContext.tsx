'use client'

import { useMediaStreamContext } from '@ui/components/media-stream/context/MediaStreamContext'
import { debounce } from 'lodash'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { sendSignal } from '../_store/conferenceSocketMiddleware'
import { ConferenceSelectors } from '../_store/selectors'
import { WebRTCState, WebRTCStateChangeType } from './types'
import { WebRTCManager } from './webrtc.service'

interface WebRTCContextValue extends WebRTCState {
  handleSignal: (senderId: string, signal: any) => Promise<void>;
}

const initialState: WebRTCState = {
  [WebRTCStateChangeType.STREAM]: {
    streams: {},
  },
  [WebRTCStateChangeType.DIALOG]: {
    currentUserId: '',
    dialogId: '',
  },
  [WebRTCStateChangeType.CONNECTION]: {
    isConnecting: false,
    connectionStatus: {},
  },
  [WebRTCStateChangeType.SIGNAL]: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  },
}

const WebRTCContext = createContext<WebRTCContextValue>({
  ...initialState,
  handleSignal: async () => {},
})

export function WebRTCProvider({ children, currentUserId, dialogId }: { children: React.ReactNode; currentUserId: string, dialogId: string }) {
  const { stream: localStream } = useMediaStreamContext()
  const manager = useRef<WebRTCManager | undefined>(undefined)

  const participants = useSelector(ConferenceSelectors.selectUsers)

  const [state, setState] = useState<WebRTCState>(initialState)

  // Инициализация менеджера
  useEffect(() => {
    manager.current = new WebRTCManager({
      currentUserId,
      dialogId,
      iceServers: initialState[WebRTCStateChangeType.SIGNAL].iceServers,
    }, sendSignal)

    const managerInstance = manager.current

    // Подписываемся на обновления состояния
    const unsubscribe = managerInstance.subscribe(setState)

    return () => {
      unsubscribe()
      if (managerInstance) {
        managerInstance.destroy()
        manager.current = undefined
      }
    }
  }, [currentUserId, dialogId])

  useEffect(() => {
    const managerInstance = manager.current
    if (!managerInstance) return

    managerInstance.setDialogId(dialogId)
  }, [dialogId])

  // Обработка изменений localStream и participants
  useEffect(() => {
    const managerInstance = manager.current
    if (!managerInstance) return

    // Используем debounce для обновления участников
    const debouncedUpdate = debounce(() => {
      if (participants.length > 0) {
        managerInstance.updateParticipants(participants)
      }
    }, 300)

    if (localStream) {
      managerInstance.setLocalStream(localStream)
    }

    debouncedUpdate()

    return () => {
      debouncedUpdate.cancel()
    }
  }, [localStream, participants])

  // Мониторинг состояния соединений
  useEffect(() => {
    const managerInstance = manager.current
    if (!managerInstance) return

    const checkConnections = () => {
      const currentState = managerInstance.getState()

      participants.forEach((participantId) => {
        if (participantId !== currentUserId) {
          const status = currentState[WebRTCStateChangeType.CONNECTION].connectionStatus[participantId]
          const stream = currentState[WebRTCStateChangeType.STREAM].streams[participantId]

          if (status === 'connected' && !stream) {
            console.log(
              `Обнаружено подключенное состояние без потока для участника с ID ${participantId}, перезапрашиваем`,
            )
            managerInstance.refreshConnection(participantId)
          }
        }
      })
    }

    // Используем RAF вместо setInterval для лучшей производительности
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
  }, [participants, currentUserId])

  const handleSignal = useCallback(async (senderId: string, signal: any) => {
    const managerInstance = manager.current
    if (!managerInstance) return
    await managerInstance.handleSignal(senderId, signal)
  }, [])

  const contextValue = useMemo<WebRTCContextValue>(() => ({
    ...state,
    handleSignal,
  }), [state, handleSignal])

  if (!manager.current) {
    return null
  }

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTC must be used within WebRTCProvider')
  }
  return context
}

'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import { useSelector } from 'react-redux'
import { useMediaStreamContext } from '@ui/components/media-stream/context/MediaStreamContext'
import { WebRTCManager, WebRTCState } from './webrtc.service'
import { sendSignal } from '../_store/conferenceSocketMiddleware'
import { ConferenceSelectors } from '../_store/selectors'

interface WebRTCContextValue extends WebRTCState {
  handleSignal: (senderId: string, signal: any) => Promise<void>;
}

const WebRTCContext = createContext<WebRTCContextValue>({
  streams: {},
  isConnecting: false,
  connectionStatus: {},
  handleSignal: async () => {},
})

export function WebRTCProvider({ children, currentUserId }: { children: React.ReactNode; currentUserId: string }) {
  const { stream: localStream } = useMediaStreamContext()
  const participants = useSelector(ConferenceSelectors.selectUsers)
  const dialogId = useSelector(ConferenceSelectors.selectConferenceId)

  const [state, setState] = useState<WebRTCState>({
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  })

  const manager = useRef<WebRTCManager | undefined>(undefined)

  // Инициализация менеджера
  useEffect(() => {
    manager.current = new WebRTCManager(currentUserId, sendSignal)

    // Сохраняем ссылку для замыкания
    const managerInstance = manager.current

    return () => {
      if (managerInstance) {
        managerInstance.destroy()
        manager.current = undefined
      }
    }
  }, [currentUserId])

  // Подписка на обновления состояния
  useEffect(() => {
    const managerInstance = manager.current
    if (!managerInstance) return

    const unsubscribe = managerInstance.subscribe(setState)
    return () => { unsubscribe() }
  }, [currentUserId])

  // Обновление стрима и участников
  useEffect(() => {
    const managerInstance = manager.current
    if (!managerInstance) return

    if (dialogId) {
      managerInstance.setDialogId(dialogId)
    }
    if (localStream) {
      managerInstance.setLocalStream(localStream)
    }
    if (participants.length > 0) {
      managerInstance.updateParticipants(participants)
    }
  }, [dialogId, localStream, participants])

  // Мониторинг состояния соединений
  useEffect(() => {
    const managerInstance = manager.current
    if (!managerInstance) return

    const checkInterval = setInterval(() => {
      const { streams, connectionStatus } = managerInstance.getState()

      participants.forEach((participantId) => {
        if (participantId !== currentUserId) {
          const status = connectionStatus[participantId]
          const stream = streams[participantId]

          if (status === 'connected' && !stream) {
            console.log(`Detected connected status without stream for ${participantId}, refreshing`)
            managerInstance.refreshConnection(participantId)
          }
        }
      })
    }, 5000)

    return () => clearInterval(checkInterval)
  }, [participants, currentUserId])

  const handleSignal = useCallback(async (senderId: string, signal: any) => {
    const managerInstance = manager.current
    if (!managerInstance) return
    await managerInstance.handleSignal(senderId, signal)
  }, [])

  const contextValue = useMemo(() => ({
    ...state,
    handleSignal,
  }), [state, handleSignal])

  // Проверяем наличие manager перед рендерингом
  if (!manager.current) {
    return null
  }

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTCContext = () => useContext(WebRTCContext)

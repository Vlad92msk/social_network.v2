'use client'

import { useMediaStreamContext } from '@ui/components/media-stream/context/MediaStreamContext'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { sendSignal } from '../_store/conferenceSocketMiddleware'
import { ConferenceSelectors } from '../_store/selectors'
import { WebRTCManager, WebRTCState } from './webrtc.service'

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

  const [state, setState] = useState<WebRTCState>(() => ({
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  }))

  // Создаем ref без начального значения
  const manager = useRef<WebRTCManager>(null)

  // Инициализируем менеджера в отдельном эффекте
  useEffect(() => {
    // Создаем нового менеджера
    manager.current = new WebRTCManager(currentUserId, sendSignal)

    return () => {
      // Очищаем при размонтировании
      if (manager.current) {
        manager.current.destroy()
        manager.current = undefined
      }
    }
  }, [currentUserId])

  // Подписываемся на обновления в отдельном эффекте
  useEffect(() => {
    if (!manager.current) return

    const unsubscribe = manager.current.subscribe(setState)
    return () => unsubscribe()
  }, [currentUserId])

  // Обновляем конфигурацию
  useEffect(() => {
    if (!manager.current) return

    if (dialogId) {
      manager.current.setDialogId(dialogId)
    }
    if (localStream) {
      manager.current.setLocalStream(localStream)
    }
    if (participants.length > 0) {
      manager.current.updateParticipants(participants)
    }
  }, [dialogId, localStream, participants])

  const handleSignal = useCallback(async (senderId: string, signal: any) => {
    if (!manager.current) return
    await manager.current.handleSignal(senderId, signal)
  }, [])

  const contextValue = useMemo(() => ({
    ...state,
    handleSignal,
  }), [state, handleSignal])

  // Не рендерим ничего, пока менеджер не инициализирован
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

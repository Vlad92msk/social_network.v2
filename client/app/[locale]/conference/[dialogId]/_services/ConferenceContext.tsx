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
  const manager = useRef<WebRTCManager>(new WebRTCManager(currentUserId, sendSignal))

  const participants = useSelector(ConferenceSelectors.selectUsers)
  const dialogId = useSelector(ConferenceSelectors.selectConferenceId)

  const [state, setState] = useState<WebRTCState>(() => ({
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  }))


  // Единый эффект для инициализации и обновления менеджера
  useEffect(() => {
    // Устанавливаем начальные значения
    if (dialogId) {
      manager.current.setDialogId(dialogId)
    }
    if (localStream) {
      manager.current.setLocalStream(localStream)
    }

    // Подписываемся на обновления
    const unsubscribe = manager.current.subscribe(setState)

    // Если есть участники, обновляем их
    if (participants.length > 0) {
      manager.current.updateParticipants(participants)
    }

    // Очистка при размонтировании или изменении currentUserId
    return () => {
      unsubscribe()
      manager.current?.destroy()
      // @ts-ignore
      manager.current = undefined
    }
  }, [currentUserId])

  // Эффект для обновления зависимостей менеджера
  useEffect(() => {
    if (manager.current) {
      // Обновляем все зависимости последовательно
      manager.current.setLocalStream(localStream)
      if (dialogId) {
        manager.current.setDialogId(dialogId)
      }
      manager.current.updateParticipants(participants)
    }
  }, [localStream, dialogId, participants]) // Обновляем при изменении любой зависимости

  // Мемоизируем handleSignal чтобы избежать лишних ререндеров
  const handleSignal = useCallback(async (senderId: string, signal: any) => {
    await manager.current?.handleSignal(senderId, signal)
  }, []) // Зависимостей нет, так как используем ref

  // Мемоизируем значение контекста
  const contextValue = useMemo(() => ({
    ...state,
    handleSignal,
  }), [state, handleSignal])

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  )
}


export const useWebRTCContext = () => useContext(WebRTCContext)

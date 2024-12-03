'use client'

import { cloneDeep } from 'lodash'
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { conferenceConfig } from './conference.config'
import { ConferenceService } from './conference.service'
import { ConferenceState, initialState } from './initial.state'



interface ConferenceContextState extends ConferenceState {
  isInitialized: boolean;
  // Управление медиа
  toggleVideo: () => Promise<void>
  toggleAudio: () => Promise<void>
  // Управление демонстрацией экрана
  startScreenShare: () => Promise<void>
  stopScreenShare: () => Promise<void>
}

const ConferenceContext = createContext<ConferenceContextState | null>(null)

interface ConferenceProviderProps {
  children: React.ReactNode
  currentUserId: string
  dialogId: string
}

export function ConferenceProvider({ children, currentUserId, dialogId }: ConferenceProviderProps) {
  const conferenceService = useRef(new ConferenceService())
  const [isInitialized, setIsInitialized] = useState(false)
  const [state, setState] = useState<ConferenceState>(initialState)

  // Инициализация сервиса
  useEffect(() => {
    const service = conferenceService.current

    const initializeConference = async () => {
      try {
        await service.initialize(
          conferenceConfig({
            signaling: { userId: currentUserId, dialogId },
            mediaConfig: {
              video: false,
              audio: false,
              echoCancellation: true,
              noiseSuppression: true,
            },
          }),
        )

        setIsInitialized(true)
      } catch (error) {
        console.error('Ошибка инициализации:', error)
        // Можно добавить обработку ошибки, например показ уведомления
      }
    }

    // Подписываемся на обновления состояния
    const unsubscribe = conferenceService.current.subscribe((newState) => {
      // приходится использовать cloneDeep
      // потому что дальше в компоненте не обновляется состояние
      // хотя это странно...
      setState(cloneDeep(newState))
    })

    initializeConference()

    // Очистка при размонтировании
    return () => {
      unsubscribe()
      service.destroy()
    }
  }, [currentUserId, dialogId])

  const value = useMemo(() => ({
    isInitialized,
    ...state,
    // Базовые методы управления медиа
    toggleVideo: () => conferenceService.current.toggleLocalVideo(),
    toggleAudio: () => conferenceService.current.toggleLocalAudio(),

    // Методы управления демонстрацией экрана
    startScreenShare: () => conferenceService.current.startScreenShare(),
    stopScreenShare: () => conferenceService.current.stopScreenShare(),
  }), [isInitialized, state])

  console.log('____value___', value)
  return (
    <ConferenceContext.Provider value={value}>
      {children}
    </ConferenceContext.Provider>
  )
}

// Хук для использования контекста
export function useConference() {
  const context = useContext(ConferenceContext)

  if (!context) {
    throw new Error('useConference must be used within ConferenceProvider')
  }
  return context
}

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
  // Управление устройствами
  switchCamera: (deviceId: string) => Promise<void>
  switchMicrophone: (deviceId: string) => Promise<void>
  getAvailableDevices: () => Promise<{
    video: MediaDeviceInfo[]
    audio: MediaDeviceInfo[]
  }>;
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
            localVideo: {
              video: false,
              audio: false,
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
    toggleVideo: () => conferenceService.current.toggleVideo(),
    toggleAudio: () => conferenceService.current.toggleAudio(),

    // Методы управления устройствами
    switchCamera: (deviceId: string) => conferenceService.current.switchCamera(deviceId),
    switchMicrophone: (deviceId: string) => conferenceService.current.switchMicrophone(deviceId),
    getAvailableDevices: () => conferenceService.current.getAvailableDevices(),

    // Методы управления демонстрацией экрана
    startScreenShare: () => conferenceService.current.startScreenShare(),
    stopScreenShare: () => conferenceService.current.stopScreenShare(),
  }), [isInitialized, state])

  // console.log('____value___', value)
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

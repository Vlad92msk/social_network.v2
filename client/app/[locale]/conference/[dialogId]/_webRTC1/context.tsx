'use client'

import { cloneDeep } from 'lodash'
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { conferenceConfig } from './conference.config'
import { ConferenceService } from './conference.service'
import { InitialState, initialState } from './initial.state'
import { Participant } from './micro-services'

export interface ConferenceContextState {
  isInitialized: boolean
  signaling: {
    isConnected: boolean
    error: Error | null
  }
  participants: Participant[]

  // Видео с камеры
  media: {
    stream?: MediaStream
    isVideoEnabled: boolean
    isAudioEnabled: boolean
    error: Error | null
  }
  toggleVideo: VoidFunction
  toggleAudio: VoidFunction
  startLocalStream: VoidFunction
  stopLocalStream: VoidFunction

  // Трансляция экрана
  localScreenShare: ReturnType<ConferenceService['getState']>['localScreenShare']
  streams: ReturnType<ConferenceService['getState']>['streams']
  startScreenShare: VoidFunction
  stopScreenShare: VoidFunction
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
  const [state, setState] = useState<InitialState>(initialState)

  // Инициализация сервиса
  useEffect(() => {
    const initializeConference = async () => {
      try {
        await conferenceService.current.initialize(
          conferenceConfig({
            signaling: { userId: currentUserId, dialogId },
            localVideo: { video: true, audio: true },
          }),
        )

        // Получаем начальное состояние
        // @ts-ignore
        setState(conferenceService.current.getState())

        const unsubscribe = conferenceService.current.subscribe((newState) => {
          // приходится использовать cloneDeep
          // потому что дальше в компоненте не обновляется состояние
          // хотя это странно...
          setState(cloneDeep(newState))
        })

        setIsInitialized(true)

        return unsubscribe
      } catch (error) {
        console.error('Ошибка инициализации:', error)
      }
    }

    initializeConference()

    return () => {
      conferenceService.current.destroy()
    }
  }, [currentUserId, dialogId, setState])

  const value: ConferenceContextState = useMemo(() => ({
    isInitialized,
    ...state,
    toggleVideo: () => conferenceService.current.toggleVideo(),
    toggleAudio: () => conferenceService.current.toggleAudio(),
    startLocalStream: () => conferenceService.current.startLocalStream(),
    stopLocalStream: () => conferenceService.current.stopLocalStream(),
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

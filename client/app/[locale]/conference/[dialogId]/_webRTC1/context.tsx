'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { ConferenceService } from './conference.service'

interface ConferenceContextState {
  isInitialized: boolean
  media: {
    stream?: MediaStream
    isVideoEnabled: boolean
    isAudioEnabled: boolean
    error: Error | null
  }
  signaling: {
    isConnected: boolean
    error: Error | null
  }
  participants: string[]
  // Методы управления
  toggleVideo: () => Promise<void>
  toggleAudio: () => void
  startLocalStream: () => Promise<void>
  stopLocalStream: () => void
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
  const [state, setState] = useState<{
    media: ConferenceContextState['media']
    signaling: ConferenceContextState['signaling']
    participants: string[]
  }>({
    media: {
      isVideoEnabled: false,
      isAudioEnabled: false,
      error: null,
    },
    signaling: {
      isConnected: false,
      error: null,
    },
    participants: [],
  })

  // Инициализация сервиса
  useEffect(() => {
    const initializeConference = async () => {
      try {
        const config = {
          signaling: {
            url: 'http://localhost:3001/conference',
            userId: currentUserId,
            dialogId,
          },
          mediaConstraints: {
            audio: true,
            video: true,
          },
        }

        await conferenceService.current.initialize({ ...config, ice: [{ urls: 'stun:stun.l.google.com:19302' }] })

        // Создаем функцию обновления состояния
        const handleStateUpdate = (newState: any) => {
          console.log('Received new state:', newState)
          setState((prevState) => {
            const nextState = {
              ...prevState,
              ...newState,
              participants: Array.isArray(newState.participants)
                ? [...newState.participants]
                : prevState.participants,
            }
            return nextState
          })
        }

        // Подписываемся с новой функцией обработки
        conferenceService.current.subscribe(handleStateUpdate)

        setIsInitialized(true)

        // Получаем начальное состояние
        handleStateUpdate(conferenceService.current.getState())
      } catch (error) {
        console.error('Failed to initialize conference:', error)
      }
    }

    initializeConference()

    return () => {
      conferenceService.current.destroy()
    }
  }, [currentUserId, dialogId])

  const value: ConferenceContextState = {
    isInitialized,
    ...state,
    toggleVideo: () => conferenceService.current.toggleVideo(),
    toggleAudio: () => conferenceService.current.toggleAudio(),
    startLocalStream: () => conferenceService.current.startLocalStream(),
    stopLocalStream: () => conferenceService.current.stopLocalStream(),
  }

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

'use client'

import { cloneDeep } from 'lodash'
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAddNotification } from '@providers/notifications/NotificationsProvider'
import { conferenceConfig } from './conference.config'
import { ConferenceState, initialState } from './initial.state'
import { ConferenceService } from './services'
import { ConferenceSliceActions } from './store/conference.slice'
import { ConferenceSelectors } from './store/selectors'

interface ConferenceContextState extends ConferenceState {
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
  const dispatch = useDispatch()
  const conferenceService = useRef(new ConferenceService())
  const [isInitialized, setIsInitialized] = useState(false)
  const [state, setState] = useState<ConferenceState>(initialState)

  const addNotification = useAddNotification()

  useEffect(() => {
    const service = conferenceService.current

    // Подписываемся на события до инициализации
    service
      .on('userJoined', ({ user }) => {
        addNotification({
          message: `${user.name} присоединился к диалогу`,
          type: 'info',
          duration: 3000,
        })
      })
      .on('userLeft', ({ leavedUser }) => {
        addNotification({
          message: `${leavedUser?.userInfo.name} покинул диалог`,
          type: 'info',
          duration: 3000,
        })
      })
      .on('userStartedScreenShare', ({ user }) => {
        addNotification({
          message: `${user?.userInfo.name} начал демонстрацию экрана`,
          type: 'info',
          duration: 3000,
        })
      })
      .on('userStartedSpeaking', ({ userId }) => {
        dispatch(ConferenceSliceActions.setSpeakingUsers({ userId, value: true }))
      })
      .on('userStoppedSpeaking', ({ userId }) => {
        dispatch(ConferenceSliceActions.setSpeakingUsers({ userId, value: false }))
      })

    const stateUnsubscribe = service.subscribe((newState) => {
      setState(cloneDeep(newState))
    })

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
      }
    }

    initializeConference()

    return () => {
      stateUnsubscribe()
      service.destroy()
    }
  }, [addNotification, currentUserId, dialogId, dispatch])

  const value = useMemo(() => ({
    ...state,
    // Базовые методы управления медиа
    toggleVideo: () => conferenceService.current.toggleLocalVideo(),
    toggleAudio: () => conferenceService.current.toggleLocalAudio(),

    // Методы управления демонстрацией экрана
    startScreenShare: () => conferenceService.current.startScreenShare(),
    stopScreenShare: () => conferenceService.current.stopScreenShare(),
  }), [state])

  // console.log('____value___', value)
  if (!isInitialized) {
    return (
      <div>
        <p>Подключение к конференции...</p>
      </div>
    )
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

export function useConferenceUserSpeaking(userId: string) {
  const speakingUsers = useSelector(ConferenceSelectors.selectSpeakingUsers)
  return speakingUsers[userId]
}

'use client'

import { Notification, NotificationProps } from '@ui/common/Notification/Notification'
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

  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: NotificationProps['type'];
  }>>([]);

  console.log('notifications', notifications)
  const addNotification = (message: string, type: NotificationProps['type'] = 'info') => {
    const id = new Date().getTime().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Инициализация сервиса
  useEffect(() => {
    const service = conferenceService.current

    // Подписываемся на события до инициализации
    service
      .on('userJoined', ({ user }) => {
        addNotification(`${user.name} присоединился к диалогу`, 'success')
      })
      .on('userLeft', ({ leavedUser }) => {
        addNotification(`${leavedUser?.userInfo.name} покинул диалог`, 'success')
      })
      .on('userStartedScreenShare', ({ user }) => {
        addNotification(`${user?.userInfo.name} начал демонстрацию экрана`, 'success')
      })

    // Подписываемся на обновления состояния
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

    // Очистка при размонтировании
    return () => {
      // Отписываемся от обновлений состояния
      stateUnsubscribe()
      // Уничтожаем сервис
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

  // console.log('____value___', value)
  return (
    <ConferenceContext.Provider value={value}>
      <button onClick={() => addNotification('Операция успешно выполнена', 'success')}>
        Показать уведомление
      </button>
      {notifications.map(({ id, message, type }, index) => (
        <Notification
          key={id}
          isOpen
          message={message}
          type={type}
          onClose={() => removeNotification(id)}
          index={index}
        />
      ))}
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

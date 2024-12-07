'use client'

import { type Placement } from '@floating-ui/react'
import React, { PropsWithChildren, useCallback, useId, useMemo } from 'react'
import { Notification } from '@ui/common/Notification/Notification'
import { createZustandContext } from '@utils/client'

interface NotificationItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  position?: Placement;
}

interface NotificationsProviderContextProps {
  notifications: NotificationItem[]
}

const initialState: NotificationsProviderContextProps = {
  notifications: [],
}
export const {
  contextZustand,
  useZustandSelector: useNotificationsCtxSelect,
  useZustandDispatch: useNotificationsCtxUpdate,
} = createZustandContext(initialState)

export const useAddNotification = () => {
  const updateContext = useNotificationsCtxUpdate()
  const id = useId()

  return useCallback((props: Omit<NotificationItem, 'id'>) => {
    const newNotification: NotificationItem = {
      ...props,
      id,
    }

    let timeoutId: NodeJS.Timeout | undefined

    const remove = () => {
      updateContext((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
      if (timeoutId) clearTimeout(timeoutId)
    }

    updateContext((state) => ({
      notifications: [...state.notifications, newNotification],
    }))

    const duration = props.duration ?? 5000
    if (duration > 0) {
      timeoutId = setTimeout(remove, duration)
    }

    return remove
  }, [id, updateContext])
}

export const useRemoveNotification = () => {
  const updateContext = useNotificationsCtxUpdate()

  return useCallback((id: string) => {
    updateContext((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  }, [updateContext])
}

interface NotificationsProviderProps extends PropsWithChildren {
}

export const NotificationsProvider = contextZustand<NotificationsProviderProps, NotificationsProviderContextProps>((props) => {
  const { children } = props

  const notifications = useNotificationsCtxSelect((ctx) => ctx.notifications)

  const removeNotification = useRemoveNotification()

  // Мемоизируем список уведомлений
  const notificationsList = useMemo(() => (
    notifications.map((notification, index) => (
      <Notification
        key={notification.id}
        isOpen
        message={notification.message}
        type={notification.type}
        duration={notification.duration}
        position={notification.position}
        onClose={() => removeNotification(notification.id)}
        index={index}
      />
    ))
  ), [notifications, removeNotification])

  return (
    <>
      {children}
      {notificationsList}
    </>
  )
})

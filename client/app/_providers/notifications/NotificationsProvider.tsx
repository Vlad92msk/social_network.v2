'use client'

import { PropsWithChildren } from 'react'
import { useSelector } from 'synapse-storage/react'
import { Notification } from '@ui/common/Notification/Notification'
import { notificationsSynapseCtx } from '../../store/synapses/notifications/notifications.context'
import { NotificationsStore } from '../../store/synapses/notifications/notifications.store'
import { notificationsSynapse } from '../../store/synapses/notifications/notifications.synapse'

interface NotificationsProviderProps extends PropsWithChildren {
}

const { removeNotification } = notificationsSynapse.actions
const { selectors } = notificationsSynapse

export const NotificationsProvider = notificationsSynapseCtx.contextSynapse<NotificationsProviderProps, NotificationsStore>((props) => {
  const { children } = props
  const notifications = useSelector(selectors.notifications)

  return (
    <>
      {children}
      {notifications?.map((notification, index) => (
        <Notification
          key={notification.id}
          isOpen
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          position={notification.position}
          onClose={() => removeNotification({ id: notification.id })}
          index={index}
        />
      ))}
    </>
  )
})

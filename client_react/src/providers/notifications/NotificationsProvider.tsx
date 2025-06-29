import { PropsWithChildren } from 'react'
import { Notification } from '@components/ui'
import { NotificationsStore, notificationsSynapse, notificationsSynapseCtx } from '@store/synapses/notifications'
import { useSelector } from 'synapse-storage/react'

interface NotificationsProviderProps extends PropsWithChildren {}

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
          containerId={'notifications'}
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

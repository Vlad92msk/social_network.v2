import { uniqueId } from 'lodash'
import { IStorage } from 'synapse-storage/core'
import { createDispatcher } from 'synapse-storage/reactive'

import { NotificationItem, NotificationsStore } from './notifications.store'

export function createNotificationsDispatcher(store: IStorage<NotificationsStore>) {
  return createDispatcher({ storage: store }, (storage, { createAction }) => ({
    addNotification: createAction<Omit<NotificationItem, 'id'>, void>({
      type: 'addNotification',
      meta: { description: 'Добавить уведомление' },
      action: async (props) => {
        const id = uniqueId('notification_')
        const newNotification = { ...props, id }

        await storage.update((state) => {
          state.notifications = [...state.notifications, newNotification]
        })
      },
    }),
    removeNotification: createAction<{ id: string }, void>({
      type: 'removeNotification',
      meta: { description: 'Удалить уведомление' },
      action: async ({ id }) => {
        await storage.update((state) => {
          state.notifications = state.notifications.filter((n) => n.id !== id)
        })
      },
    }),
  }))
}

export type NotificationsDispatcher = ReturnType<typeof createNotificationsDispatcher>

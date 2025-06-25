import type { Placement } from '@floating-ui/react'
import { broadcastMiddleware, MemoryStorage } from 'synapse-storage/core'

export interface NotificationItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  position?: Placement
}

export interface NotificationsStore {
  notifications: NotificationItem[]
}

export async function createUserInfoStorage() {
  const storageName = 'app-notifications'

  return new MemoryStorage<NotificationsStore>({
    name: storageName,
    initialState: {
      notifications: [],
    },
    middlewares: () => {
      const broadcast = broadcastMiddleware({
        storageName,
        storageType: 'memory',
      })
      return [broadcast]
    },
  }).initialize()
}

export type NotificationsStorage = Awaited<ReturnType<typeof createUserInfoStorage>>

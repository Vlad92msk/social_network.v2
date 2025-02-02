// state-sync.middleware.ts
import { Middleware, NextFunction } from '@ui/modules/synapse/services/core/core.interface'
import { StateStorage, StateSyncConfig } from '@ui/modules/synapse/services/state-sync/state-sync.interface'
import { StateSyncModule } from '@ui/modules/synapse/services/state-sync/state-sync.service'
import { StorageContext } from '@ui/modules/synapse/services/storage/storage.interface'

export const createStateSyncMiddleware = (
  config: Omit<StateSyncConfig, 'storage'>,
): Middleware => {
  let stateSync: StateSyncModule
  // Храним подписки отдельно для каждого ключа
  const subscriptions = new Map<string, Set<(value: any) => void>>()

  const initStateSync = (context: StorageContext) => {
    if (!stateSync) {
      const storage: StateStorage = {
        get: async (key) => {
          const result = await context.baseOperation?.({
            ...context,
            type: 'get',
            key,
          })
          return result
        },
        set: async (key, value) => {
          await context.baseOperation?.({
            ...context,
            type: 'set',
            key,
            value,
          })
          // Уведомляем подписчиков при изменении значения
          const callbacks = subscriptions.get(key)
          if (callbacks) {
            callbacks.forEach((callback) => callback(value))
          }
        },
        delete: async (key) => {
          await context.baseOperation?.({
            ...context,
            type: 'delete',
            key,
          })
          // Уведомляем подписчиков об удалении
          const callbacks = subscriptions.get(key)
          if (callbacks) {
            callbacks.forEach((callback) => callback(undefined))
          }
        },
        clear: async () => {
          await context.baseOperation?.({
            ...context,
            type: 'clear',
          })
          // Уведомляем всех подписчиков
          subscriptions.forEach((callbacks) => {
            callbacks.forEach((callback) => callback(undefined))
          })
        },
      }

      stateSync = new StateSyncModule({
        storage,
        ...config,
      })

      // Подписываемся на обновления из других вкладок
      stateSync.subscribe('*', async (value) => {
        const callbacks = subscriptions.get('*')
        if (callbacks) {
          callbacks.forEach((callback) => callback(value))
        }
      })
    }
    return stateSync
  }

  const middleware: Middleware = (next: NextFunction) => async (context: StorageContext) => {
    const sync = initStateSync(context)

    switch (context.type) {
      case 'set': {
        await sync.set(context.key!, context.value)
        return next(context)
      }

      case 'delete': {
        await sync.delete(context.key!)
        return next(context)
      }

      case 'clear': {
        await sync.clear()
        return next(context)
      }

      default:
        return next(context)
    }
  }
  return middleware
}

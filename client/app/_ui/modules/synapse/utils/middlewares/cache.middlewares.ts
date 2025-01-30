import { CacheConfig, CacheModule, CacheStorage } from '@ui/modules/synapse/services/cache/cache-module.service'
import { Middleware, NextFunction, StorageContext } from '@ui/modules/synapse/services/core/core.interface'

export const createCacheMiddleware = (config: Omit<CacheConfig, 'storage'>): Middleware => {
  let cache: CacheModule
  // Храним подписки отдельно для каждого ключа
  const subscriptions = new Map<string, Set<(value: any) => void>>()

  const initCache = (context: StorageContext) => {
    if (!cache) {
      const storage: CacheStorage = {
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
        keys: async () => {
          const result = await context.baseOperation?.({
            ...context,
            type: 'keys',
          })
          return result
        },
        subscribe: (key, callback) => {
          if (!subscriptions.has(key)) {
            subscriptions.set(key, new Set())
          }
          subscriptions.get(key)!.add(callback)

          // Возвращаем функцию отписки
          return () => {
            const callbacks = subscriptions.get(key)
            if (callbacks) {
              callbacks.delete(callback)
              if (callbacks.size === 0) {
                subscriptions.delete(key)
              }
            }
          }
        },
      }

      cache = new CacheModule({
        storage,
        ...config,
      })
    }
    return cache
  }

  return (next: NextFunction) => async (context: StorageContext) => {
    const cache = initCache(context)

    switch (context.type) {
      case 'get': {
        const cached = await cache.get(context.key!)
        if (cached !== undefined) return cached

        const value = await next(context)
        if (value !== undefined) {
          await cache.set(context.key!, value)
        }
        return value
      }

      case 'set': {
        await cache.set(context.key!, context.value)
        return next(context)
      }

      case 'delete': {
        await cache.delete(context.key!)
        return next(context)
      }

      case 'clear': {
        await cache.clear()
        return next(context)
      }

      default:
        return next(context)
    }
  }
}

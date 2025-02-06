import { CacheEntry, CacheOptions, CacheUtils } from './cache-module.service'
import { Middleware, MiddlewareAPI } from '../../utils/middleware-module'

export const createCacheMiddleware = (options: CacheOptions = {}): Middleware => {
  let cleanupInterval: NodeJS.Timeout | undefined

  const isCachedValue = (value: any): value is CacheEntry<any> => value && 'metadata' in value && 'data' in value

  const clearExpired = async (api: MiddlewareAPI) => {
    const keys = await api.storage.doKeys()
    for (const key of keys) {
      const value = await api.storage.doGet(key)
      if (isCachedValue(value) && CacheUtils.isExpired(value.metadata)) {
        await api.dispatch({
          type: 'delete',
          key,
          metadata: { reason: 'expired' },
        })
      }
    }
  }

  return (api) => {
    if (options.cleanup?.enabled && options.cleanup.interval) {
      cleanupInterval = setInterval(
        () => clearExpired(api),
        options.cleanup.interval,
      )
    }

    return (next) => async (action) => {
      switch (action.type) {
        case 'get': {
          try {
            const result = await next(action)
            if (!result) return undefined

            // Если значение уже в кэш-структуре
            if (isCachedValue(result)) {
              if (CacheUtils.isExpired(result.metadata)) {
                await api.dispatch({
                  type: 'delete',
                  key: action.key,
                  metadata: { reason: 'expired' },
                })
                return undefined
              }

              const updatedValue: CacheEntry<any> = {
                data: result.data,
                metadata: CacheUtils.updateMetadata(result.metadata),
              }

              await api.dispatch({
                type: 'set',
                key: action.key,
                value: updatedValue,
                metadata: { isCache: true },
              })

              return result.data // Возвращаем только данные
            }

            return result
          } catch (error) {
            if (options.invalidateOnError) {
              await api.dispatch({
                type: 'delete',
                key: action.key,
                metadata: { reason: 'error' },
              })
            }
            throw error
          }
        }

        case 'set': {
          // Если значение уже в кэш-структуре, не оборачиваем снова
          if (isCachedValue(action.value)) {
            return next(action)
          }

          const valueWithMetadata: CacheEntry<any> = {
            data: action.value,
            metadata: CacheUtils.createMetadata(options.ttl),
          }
          return next({ ...action, value: valueWithMetadata })
        }

        default:
          return next(action)
      }
    }
  }
}

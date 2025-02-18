import { CacheEntry, CacheOptions, CacheUtils } from './cache-module.service'
import { Middleware, MiddlewareAPI, NextFunction, StorageAction } from '../../utils/middleware-module'
import { StorageKeyType } from '../../utils/storage-key'

export const createCacheMiddleware = (options: CacheOptions = {}): Middleware => {
  let cleanupInterval: NodeJS.Timeout | undefined

  const isCachedValue = (value: any): value is CacheEntry<any> => value
    && 'metadata' in value
    && 'data' in value
    // && 'params' in value;

  // Функция для очистки просроченных записей кеша
  const clearExpired = async (api: MiddlewareAPI) => {
    const keys = await api.storage.doKeys()
    for (const key of keys) {
      const value = await api.storage.doGet(key as StorageKeyType)
      if (isCachedValue(value) && CacheUtils.isExpired(value.metadata)) {
        await api.dispatch({
          type: 'delete',
          key,
          metadata: { reason: 'expired' },
        })
      }
    }
  }

  // Функция для инвалидации кэша по тегам
  const invalidateByTags = async (api: MiddlewareAPI, tags: string[]) => {
    const keys = await api.storage.doKeys()
    for (const key of keys) {
      const value = await api.storage.doGet(key as StorageKeyType)
      if (isCachedValue(value) && CacheUtils.hasAnyTag(value.metadata, tags)) {
        await api.dispatch({
          type: 'delete',
          key,
          metadata: { reason: 'invalidated_by_tags' },
        })
      }
    }
  }

  return {
    name: 'cache',
    setup: (api: MiddlewareAPI) => {
      if (options.cleanup?.enabled && options.cleanup.interval) {
        cleanupInterval = setInterval(() => clearExpired(api), options.cleanup.interval)
      }
    },

    reducer: (api: MiddlewareAPI) => (next: NextFunction) => async (action: StorageAction) => {
      const rule = CacheUtils.findRule(action.key, options.rules)

      switch (action.type) {
        case 'get': {
          try {
            const result = await next(action)
            if (!result) return undefined

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
                params: result.params,
              }

              await api.dispatch({
                type: 'set',
                key: action.key,
                value: updatedValue,
                metadata: { isCache: true },
              })

              return result.data
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
          if (isCachedValue(action.value)) {
            return next(action)
          }

          // Если есть правило с invalidateTags, инвалидируем соответствующие кэши
          if (rule?.invalidateTags) {
            await invalidateByTags(api, rule.invalidateTags)
          }

          const valueWithMetadata: CacheEntry<any> = {
            data: action.value,
            metadata: CacheUtils.createMetadata(rule?.ttl ?? options.ttl, rule?.tags),
            params: action.value?.keyParams || {},
          }

          return next({ ...action, value: valueWithMetadata })
        }

        default:
          return next(action)
      }
    },

    cleanup: () => {
      if (cleanupInterval) {
        clearInterval(cleanupInterval)
      }
    },
  }
}

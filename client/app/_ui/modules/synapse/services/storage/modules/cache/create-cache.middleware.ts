import { CacheEntry, CacheOptions, CacheUtils } from './cache-module.service'
import { IStorage, Middleware, NextFunction, StorageContext } from '../../storage.interface'

export const createCacheMiddleware = (options: CacheOptions = {}): Middleware => {
  let cleanupInterval: NodeJS.Timeout | undefined

  const isCachedValue = (value: any): value is CacheEntry<any> => value && 'metadata' in value && 'data' in value

  // Функция для очистки истекших данных
  const clearExpired = async (storage: IStorage) => {
    const keys = await storage.keys()
    for (const key of keys) {
      const value = await storage.get<any>(key)
      if (isCachedValue(value) && CacheUtils.isExpired(value.metadata)) {
        await storage.delete(key)
      }
    }
  }

  const initCleanup = (storage: IStorage) => {
    if (options.cleanup?.enabled && options.cleanup.interval) {
      cleanupInterval = setInterval(
        () => clearExpired(storage),
        options.cleanup.interval,
      )
    }
  }

  return (context: StorageContext) => {
    if (!cleanupInterval && context.storage) {
      initCleanup(context.storage)
    }

    return async (next: NextFunction) => {
      const { type, key, value, storage } = context

      switch (type) {
        case 'get': {
          try {
            const result = await next(context)
            if (!result) return undefined

            if (isCachedValue(result)) {
              if (CacheUtils.isExpired(result.metadata)) {
                await storage?.delete(key!)
                return undefined
              }

              const updatedValue: CacheEntry<any> = {
                data: result.data,
                metadata: CacheUtils.updateMetadata(result.metadata),
              }
              await storage?.set(key!, updatedValue)
              return updatedValue.data
            }

            return result
          } catch (error) {
            if (options.invalidateOnError) {
              await storage?.delete(key!)
            }
            throw error
          }
        }

        case 'set': {
          const valueWithMetadata: CacheEntry<any> = {
            data: value,
            metadata: CacheUtils.createMetadata(options.ttl),
          }
          return next({ ...context, value: valueWithMetadata })
        }

        case 'init': {
          const result = await next(context)

          if (result) {
            const processedResult: Record<string, any> = {}

            for (const [key, value] of Object.entries(result)) {
              processedResult[key] = isCachedValue(value) ? value : {
                data: value,
                metadata: CacheUtils.createMetadata(options.ttl),
              }
            }

            return processedResult
          }

          return result
        }

        default:
          return next(context)
      }
    }
  }
}

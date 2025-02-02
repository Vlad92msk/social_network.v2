import { CacheEntry, CacheMetadata, CacheOptions } from './cache-module.service'
import { Middleware, NextFunction, StorageContext } from '../../storage.interface'

export const createCacheMiddleware = (options: CacheOptions): Middleware => {
  // Функция создания метаданных
  const createMetadata = (): CacheMetadata => ({
    createdAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: Date.now() + (options.ttl || 0),
    accessCount: 0,
  })

  // Функция проверки срока действия
  const isExpired = (metadata: CacheMetadata): boolean => Date.now() > metadata.expiresAt

  const middleware: Middleware = (next: NextFunction) => async (
    context: StorageContext<unknown>,
  ) => {
    switch (context.type) {
      case 'get': {
        const entry = await next(context) as CacheEntry<unknown> | undefined

        if (!entry) return undefined

        if (isExpired(entry.metadata)) {
          await context.baseOperation?.({
            ...context,
            type: 'delete',
            key: context.key,
          })
          return undefined
        }

        entry.metadata.accessCount++
        await context.baseOperation?.({
          ...context,
          type: 'set',
          value: entry,
        })

        return entry.data
      }

      case 'set': {
        const cacheEntry: CacheEntry<unknown> = {
          data: context.value,
          metadata: createMetadata(),
        }

        context.value = cacheEntry
        return next(context)
      }

      default:
        return next(context)
    }
  }

  return middleware
}

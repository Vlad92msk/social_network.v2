import { CacheEntry, CacheOptions, CacheUtils } from './cache-module.service'
import { Middleware, MiddlewareAPI, NextFunction, StorageAction } from '../../utils/middleware-module'

export const createCacheMiddleware = (options: CacheOptions = {}): Middleware => {
  // Храним ссылку на интервал очистки для возможности его очистки
  let cleanupInterval: NodeJS.Timeout | undefined

  // Функция для проверки, является ли значение кешированной записью
  const isCachedValue = (value: any): value is CacheEntry<any> => value && 'metadata' in value && 'data' in value

  // Функция для очистки просроченных записей кеша
  const clearExpired = async (api: MiddlewareAPI) => {
    // Получаем все ключи из хранилища
    const keys = await api.storage.doKeys()

    // Проверяем каждый ключ
    for (const key of keys) {
      const value = await api.storage.doGet(key)
      // Если значение кешировано и просрочено - удаляем его
      if (isCachedValue(value) && CacheUtils.isExpired(value.metadata)) {
        await api.dispatch({
          type: 'delete',
          key,
          metadata: { reason: 'expired' },
        })
      }
    }
  }

  return {
    // Инициализация middleware при его создании
    setup: (api: MiddlewareAPI) => {
      // console.log('Cache middleware initialized')

      // Если включена автоматическая очистка, устанавливаем интервал
      if (options.cleanup?.enabled && options.cleanup.interval) {
        cleanupInterval = setInterval(
          () => clearExpired(api),
          options.cleanup.interval,
        )
      }
    },
    // Основная логика обработки действий
    reducer: (api: MiddlewareAPI) => (next: NextFunction) => async (action: StorageAction) => {
      switch (action.type) {
        case 'get': {
          try {
            // Получаем значение из следующего middleware в цепочке
            const result = await next(action)
            if (!result) return undefined

            // Если значение кешировано
            if (isCachedValue(result)) {
              // Проверяем не истек ли срок хранения
              if (CacheUtils.isExpired(result.metadata)) {
                // Если истек - удаляем запись
                await api.dispatch({
                  type: 'delete',
                  key: action.key,
                  metadata: { reason: 'expired' },
                })
                return undefined
              }

              // Обновляем метаданные кеша (например, lastAccessed)
              const updatedValue: CacheEntry<any> = {
                data: result.data,
                metadata: CacheUtils.updateMetadata(result.metadata),
              }

              // Сохраняем обновленные метаданные
              await api.dispatch({
                type: 'set',
                key: action.key,
                value: updatedValue,
                metadata: { isCache: true },
              })

              // Возвращаем только данные, без метаданных кеша
              return result.data
            }

            // Если значение не кешировано, возвращаем как есть
            return result
          } catch (error) {
            // При ошибке можем инвалидировать кеш
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
          // Если значение уже в формате кеша, не оборачиваем повторно
          if (isCachedValue(action.value)) {
            return next(action)
          }

          // Оборачиваем значение в структуру кеша с метаданными
          const valueWithMetadata: CacheEntry<any> = {
            data: action.value,
            metadata: CacheUtils.createMetadata(options.ttl),
          }
          // Передаем обернутое значение дальше по цепочке
          return next({ ...action, value: valueWithMetadata })
        }

        // Для остальных типов действий просто передаем дальше
        default:
          return next(action)
      }
    },
  }
}

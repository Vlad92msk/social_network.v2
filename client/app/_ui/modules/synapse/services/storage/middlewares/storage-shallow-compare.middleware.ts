import { Middleware, NextFunction, StorageContext } from '../storage.interface'

export interface ShallowCompareMiddlewareOptions {
  segments?: string[]
  // Функция для сравнения значений
  comparator?: <T>(prev: T, next: T) => boolean
}

export const createShallowCompareMiddleware = (
  options: ShallowCompareMiddlewareOptions = {},
): Middleware => {
  const {
    comparator = (prev: any, next: any) => {
      if (prev === next) return true

      if (
        typeof prev !== 'object'
        || typeof next !== 'object'
        || prev === null
        || next === null
      ) {
        return prev === next
      }

      const keysA = Object.keys(prev)
      const keysB = Object.keys(next)

      if (keysA.length !== keysB.length) return false

      return keysA.every((key) => Object.prototype.hasOwnProperty.call(next, key)
        && prev[key] === next[key])
    },
    segments = [],
  } = options

  // Кэш последних значений
  const valueCache = new Map<string, any>()

  return (context: StorageContext) => async (next: NextFunction) => {
    // Проверяем только операции set
    if (context.type !== 'set' || (segments.length && !segments.includes(context.segment ?? 'default'))) {
      return next(context)
    }

    const cacheKey = context.key!
    const prevValue = valueCache.get(cacheKey)
    const nextValue = context.value

    // Если значения равны, пропускаем операцию
    if (prevValue !== undefined && comparator(prevValue, nextValue)) {
      return prevValue
    }

    // Иначе обновляем кэш и продолжаем
    const result = await next(context)
    valueCache.set(cacheKey, nextValue)
    return result
  }
}

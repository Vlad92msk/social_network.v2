// storage-shallow-compare.middleware.ts

import { MiddlewareFactory, NextFunction, StorageContext } from '../../core/core.interface'

export interface ShallowCompareMiddlewareOptions {
  segments?: string[]
  // Функция для сравнения значений
  comparator?: <T>(prev: T, next: T) => boolean
}

export const createShallowCompareMiddleware: MiddlewareFactory<ShallowCompareMiddlewareOptions> = (
  options: ShallowCompareMiddlewareOptions = {},
) => {
  const {
    segments = [],
    // По умолчанию используем простое сравнение
    comparator = (prev, next) => prev === next,
  } = options

  return (next: NextFunction) => async (context: StorageContext) => {
    // Проверяем только операции set
    if (context.type !== 'set') {
      return next(context)
    }

    // Проверяем сегмент
    const segmentKey = context.key?.split('.')[0] || 'default'
    if (segments.length > 0 && !segments.includes(segmentKey)) {
      return next(context)
    }

    try {
      // Получаем текущее значение
      const currentValue = await next({
        type: 'get',
        key: context.key,
      })

      // Если значения равны - пропускаем обновление
      if (currentValue !== undefined && comparator(currentValue, context.value)) {
        return context.value
      }

      // Если значения разные или текущего значения нет - обновляем
      return next(context)
    } catch (error) {
      // В случае ошибки - просто выполняем операцию
      return next(context)
    }
  }
}

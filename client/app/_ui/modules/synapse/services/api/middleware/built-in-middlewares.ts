import { ApiMiddlewareAPI, ApiMiddlewareContext, ApiNextFunction, EnhancedApiMiddleware } from '../types/api-middleware.interface'
import { apiLogger } from '../utils/api-helpers'

/**
 * Создает middleware для логирования запросов
 * @param options Опции логгера
 * @returns Объект middleware
 */
export function createLoggerMiddleware(options: {
  logLevel?: 'info' | 'debug' | 'warn' | 'error',
  includeHeaders?: boolean,
  maskSensitiveData?: boolean
} = {}): EnhancedApiMiddleware {
  return {
    name: 'logger-middleware',
    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      const { endpointName, requestId, params } = context
      const startTime = performance.now()

      const logParams = options.maskSensitiveData ? '[СКРЫТО]' : params

      if (options.logLevel === 'debug' || !options.logLevel) {
        apiLogger.debug(`[${requestId}] Запрос ${endpointName} начат`, { params: logParams })

        if (options.includeHeaders) {
          apiLogger.debug(`[${requestId}] Заголовки запроса:`, context.options.headers)
        }
      } else {
        apiLogger.info(`[${requestId}] Запрос ${endpointName} начат`)
      }

      try {
        // Отправляем событие о начале запроса
        api.emitEvent('request:start', {
          type: 'request:start',
          endpointName,
          requestId,
          params: options.maskSensitiveData ? undefined : params,
        })

        const result = await next(context)
        const duration = performance.now() - startTime

        if (options.logLevel === 'debug' || !options.logLevel) {
          apiLogger.debug(
            `[${requestId}] Запрос ${endpointName} успешно завершен за ${duration.toFixed(2)}ms`,
            { result: options.maskSensitiveData ? '[СКРЫТО]' : result },
          )
        } else {
          apiLogger.info(`[${requestId}] Запрос ${endpointName} успешно завершен за ${duration.toFixed(2)}ms`)
        }

        // Отправляем событие об успешном запросе
        api.emitEvent('request:success', {
          type: 'request:success',
          endpointName,
          requestId,
          params: options.maskSensitiveData ? undefined : params,
          result: options.maskSensitiveData ? undefined : result,
          duration,
          fromCache: false,
        })

        return result
      } catch (error) {
        const duration = performance.now() - startTime

        apiLogger.error(
          `[${requestId}] Запрос ${endpointName} завершился ошибкой за ${duration.toFixed(2)}ms`,
          error,
        )

        // Отправляем событие об ошибке запроса
        api.emitEvent('request:error', {
          type: 'request:error',
          endpointName,
          requestId,
          params: options.maskSensitiveData ? undefined : params,
          error: error as Error,
          duration,
        })

        throw error
      }
    },
  }
}

/**
 * Создает middleware для установки заголовков авторизации
 * @param getAuthToken Функция получения токена авторизации
 * @returns Объект middleware
 */
export function createAuthMiddleware(
  getAuthToken: () => string | Promise<string>,
): EnhancedApiMiddleware {
  return {
    name: 'auth-middleware',
    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      try {
        // Получаем текущий токен
        const token = await getAuthToken()

        if (token) {
          // Обновляем заголовки запроса
          const headers = new Headers(context.options.headers || {})
          headers.set('Authorization', `Bearer ${token}`)

          // Обновляем опции запроса
          api.updateOptions(context, {
            headers: Object.fromEntries(headers.entries()),
          })
        }
      } catch (error) {
        apiLogger.warn('Не удалось установить токен авторизации', error)
      }

      // Продолжаем цепочку middleware
      return next(context)
    },
  }
}

/**
 * Создает middleware для добавления пользовательских заголовков
 * @param headers Объект с заголовками или функция, возвращающая заголовки
 * @returns Объект middleware
 */
export function createHeadersMiddleware(
  headers: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>),
): EnhancedApiMiddleware {
  return {
    name: 'headers-middleware',
    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      try {
        // Получаем заголовки (статические или из функции)
        const customHeaders = typeof headers === 'function'
          ? await headers()
          : headers

        if (customHeaders && Object.keys(customHeaders).length > 0) {
          // Обновляем заголовки запроса
          const currentHeaders = new Headers(context.options.headers || {})

          // Добавляем каждый заголовок
          Object.entries(customHeaders).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              currentHeaders.set(key, value)
            }
          })

          // Обновляем опции запроса
          api.updateOptions(context, {
            headers: Object.fromEntries(currentHeaders.entries()),
          })
        }
      } catch (error) {
        apiLogger.warn('Не удалось установить пользовательские заголовки', error)
      }

      // Продолжаем цепочку middleware
      return next(context)
    },
  }
}

/**
 * Создает middleware для кэширования запросов в памяти
 * @param options Опции кэширования
 * @returns Объект middleware
 */
export function createCacheMiddleware(options: {
  ttl?: number, // время жизни кэша в миллисекундах
  maxSize?: number, // максимальный размер кэша
  keyGenerator?: (context: ApiMiddlewareContext) => string // генератор ключей кэша
} = {}): EnhancedApiMiddleware {
  // Настройки по умолчанию
  const settings = {
    ttl: options.ttl || 5 * 60 * 1000, // 5 минут по умолчанию
    maxSize: options.maxSize || 100, // 100 записей по умолчанию
    keyGenerator: options.keyGenerator || ((context) => {
      // Генерация ключа на основе имени эндпоинта и параметров
      const { endpointName, params } = context
      return `${endpointName}:${JSON.stringify(params)}`
    }),
  }

  // Кэш в памяти
  const cache = new Map<string, {
    data: any,
    timestamp: number,
    expiresAt: number
  }>()

  // Упорядоченный список ключей (для LRU)
  const keyOrder: string[] = []

  // Обновление порядка ключей (для LRU)
  const touchKey = (key: string) => {
    const idx = keyOrder.indexOf(key)
    if (idx !== -1) {
      keyOrder.splice(idx, 1)
    }
    keyOrder.push(key)

    // Очистка самых старых записей, если превышен размер
    while (keyOrder.length > settings.maxSize) {
      const oldestKey = keyOrder.shift()
      if (oldestKey) {
        cache.delete(oldestKey)
      }
    }
  }

  return {
    name: 'cache-middleware',

    setup(api) {
      // Можно добавить интерфейс для управления кэшем
      // Например, подписаться на события инвалидации
    },

    cleanup() {
      // Очищаем кэш при удалении middleware
      cache.clear()
      keyOrder.length = 0
    },

    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      const { endpointName, options } = context

      // Если кэширование отключено для этого запроса, выполняем его напрямую
      if (options.disableCache) {
        return next(context)
      }

      // Генерируем ключ кэша
      const cacheKey = settings.keyGenerator(context)

      // Проверяем наличие данных в кэше
      const cached = cache.get(cacheKey)
      const now = Date.now()

      if (cached && cached.expiresAt > now) {
        // Данные есть в кэше и они не устарели
        touchKey(cacheKey) // Обновляем LRU

        // Отправляем событие о попадании в кэш
        api.emitEvent('cache:hit', {
          type: 'cache:hit',
          endpointName,
          requestId: context.requestId,
          params: context.params,
          cacheKey,
        })

        return cached.data
      }

      // Данных нет в кэше или они устарели
      if (cached) {
        // Отправляем событие о промахе кэша (истек срок)
        api.emitEvent('cache:miss', {
          type: 'cache:miss',
          endpointName,
          requestId: context.requestId,
          params: context.params,
          cacheKey,
        })
      }

      // Выполняем запрос
      const result = await next(context)

      // Сохраняем результат в кэш
      cache.set(cacheKey, {
        data: result,
        timestamp: now,
        expiresAt: now + settings.ttl,
      })

      // Обновляем LRU
      touchKey(cacheKey)

      return result
    },
  }
}

/**
 * Создает middleware для обработки ошибок
 * @param handler Обработчик ошибок
 * @returns Объект middleware
 */
export function createErrorHandlerMiddleware(
  handler: (error: Error, context: ApiMiddlewareContext) => Promise<any> | any,
): EnhancedApiMiddleware {
  return {
    name: 'error-handler-middleware',
    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      try {
        // Выполняем запрос
        return await next(context)
      } catch (error) {
        // Вызываем обработчик ошибок
        return handler(error as Error, context)
      }
    },
  }
}

/**
 * Создает middleware для повторных попыток запроса при ошибках
 * @param options Опции для retry middleware
 * @returns Объект middleware
 */
export function createRetryMiddleware(options: {
  maxRetries?: number,
  retryDelay?: number | ((attempt: number, error: Error) => number),
  retryCondition?: (error: Error, context: ApiMiddlewareContext) => boolean
} = {}): EnhancedApiMiddleware {
  // Настройки по умолчанию
  const settings = {
    maxRetries: options.maxRetries || 3,
    retryDelay: options.retryDelay || 1000,
    retryCondition: options.retryCondition || ((error) =>
      // По умолчанию повторяем только сетевые ошибки или 5xx ошибки
      error.name === 'NetworkError'
             || (error instanceof Error && error.message.includes('5'))
             || false
    ),
  }

  // Функция для паузы
  const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

  return {
    name: 'retry-middleware',
    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      let lastError: Error

      // Пробуем выполнить запрос несколько раз
      for (let attempt = 0; attempt <= settings.maxRetries; attempt++) {
        try {
          // В первый раз выполняем запрос сразу
          if (attempt > 0) {
            // Для повторных попыток ждем определенное время
            const delay = typeof settings.retryDelay === 'function'
              ? settings.retryDelay(attempt, lastError!)
              : settings.retryDelay

            await wait(delay)

            apiLogger.info(
              `[${context.requestId}] Повторная попытка запроса ${context.endpointName} (${attempt}/${settings.maxRetries})`,
            )
          }

          return await next(context)
        } catch (error) {
          lastError = error as Error

          // Проверяем, нужно ли повторять запрос
          const shouldRetry = attempt < settings.maxRetries
                            && settings.retryCondition(lastError, context)

          if (!shouldRetry) {
            // Если не нужно повторять, пробрасываем ошибку дальше
            throw lastError
          }

          // Логируем информацию о повторной попытке
          apiLogger.warn(
            `[${context.requestId}] Ошибка запроса ${context.endpointName}, повторная попытка ${attempt + 1}/${settings.maxRetries}`,
            lastError,
          )
        }
      }

      // Этот код не должен выполняться, но TypeScript требует возврата
      throw lastError!
    },
  }
}

/**
 * Создает middleware для трансформации параметров запроса
 * @param transformer Функция трансформации параметров
 * @returns Объект middleware
 */
export function createParamsTransformerMiddleware(
  transformer: (params: any, context: ApiMiddlewareContext) => any,
): EnhancedApiMiddleware {
  return {
    name: 'params-transformer-middleware',
    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      // Создаем новый контекст с трансформированными параметрами
      const transformedContext = {
        ...context,
        params: transformer(context.params, context),
      }

      // Продолжаем цепочку с измененными параметрами
      return next(transformedContext)
    },
  }
}

/**
 * Создает middleware для трансформации результата запроса
 * @param transformer Функция трансформации результата
 * @returns Объект middleware
 */
export function createResultTransformerMiddleware(
  transformer: (result: any, context: ApiMiddlewareContext) => any,
): EnhancedApiMiddleware {
  return {
    name: 'result-transformer-middleware',
    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      // Выполняем запрос
      const result = await next(context)

      // Трансформируем результат
      return transformer(result, context)
    },
  }
}

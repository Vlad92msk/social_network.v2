import { createApiClient } from '../components/api-client'
import {
  createAuthMiddleware,
  createCacheMiddleware,
  createErrorHandlerMiddleware,
  createHeadersMiddleware,
  createLoggerMiddleware,
  createRetryMiddleware,
} from '../components/middleware/built-in-middlewares'
import { ApiMiddlewareAPI, ApiMiddlewareContext, ApiNextFunction, EnhancedApiMiddleware } from '../types/api-middleware.interface'

// Пример создания API-клиента с middleware
export const createExampleClient = () => {
  // Создаем API-клиент
  const apiClient = createApiClient({
    storageType: 'localStorage',
    baseQuery: {
      baseUrl: 'https://api.example.com',
      timeout: 10000,
    },
    endpoints: (create) => ({
      getUsers: create({
        request: () => ({
          path: '/users',
          method: 'GET',
        }),
        cache: true,
        tags: ['users'],
      }),
      getUserById: create({
        request: (id: number) => ({
          path: `/users/${id}`,
          method: 'GET',
        }),
        cache: true,
        tags: ['users'],
      }),
      createUser: create({
        request: (userData: any) => ({
          path: '/users',
          method: 'POST',
          body: userData,
        }),
        invalidatesTags: ['users'],
      }),
    }),
  })

  // Добавляем middleware для логирования
  apiClient.use(createLoggerMiddleware({
    logLevel: 'info',
    includeHeaders: true,
    maskSensitiveData: true,
  }))

  // Добавляем middleware для авторизации
  apiClient.use(createAuthMiddleware(() => localStorage.getItem('auth_token') || ''))

  // Добавляем middleware для повторных попыток при ошибках
  apiClient.use(createRetryMiddleware({
    maxRetries: 3,
    retryDelay: (attempt) => 2 ** attempt * 1000, // Экспоненциальная задержка
    retryCondition: (error) =>
      // Повторяем попытку только для определенных ошибок
      error.name === 'NetworkError'
             || error.message.includes('timeout')
             || error.message.includes('5'),

  }))

  // Добавляем middleware для кэширования
  apiClient.use(createCacheMiddleware({
    ttl: 5 * 60 * 1000, // 5 минут
    maxSize: 100,
  }))

  // Добавляем middleware для пользовательских заголовков
  apiClient.use(createHeadersMiddleware({
    'X-Client-Version': '1.0.0',
    'X-App-Platform': 'web',
  }))

  // Пример собственного middleware
  apiClient.use({
    name: 'custom-middleware',
    process: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => async (context: ApiMiddlewareContext) => {
      // Код перед запросом
      console.log(`Выполняется запрос к ${context.endpointName}`)

      try {
        // Выполняем запрос
        const result = await next(context)

        // Код после успешного запроса
        console.log(`Запрос к ${context.endpointName} выполнен успешно`)

        return result
      } catch (error) {
        // Код при ошибке запроса
        console.error(`Ошибка запроса к ${context.endpointName}`, error)
        throw error
      }
    },
  })

  // Добавляем middleware для обработки ошибок (должен быть последним)
  apiClient.use(createErrorHandlerMiddleware((error, context) => {
    // Можно обработать ошибку и вернуть запасные данные
    console.error(`Критическая ошибка в ${context.endpointName}:`, error)

    // Для некоторых эндпоинтов возвращаем запасные данные
    if (context.endpointName === 'getUsers') {
      return []
    }

    // Для остальных пробрасываем ошибку дальше
    throw error
  }))

  return apiClient
}

// Пример создания собственного middleware
export const createMonitoringMiddleware = (monitoringServiceUrl: string): EnhancedApiMiddleware => {
  // Функция для отправки данных в систему мониторинга
  const sendMetrics = async (metrics: any) => {
    try {
      await fetch(monitoringServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      })
    } catch (error) {
      console.error('Ошибка отправки метрик:', error)
    }
  }

  return {
    name: 'monitoring-middleware',

    // Настройка middleware при инициализации
    setup(api) {
      console.log('Инициализация мониторинга API')
    },

    // Очистка ресурсов при удалении middleware
    cleanup() {
      console.log('Отключение мониторинга API')
    },

    // Обработка запросов
    process: (api) => (next) => async (context) => {
      const startTime = performance.now()
      const requestMetrics = {
        endpoint: context.endpointName,
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        params: JSON.stringify(context.params),
        status: 'pending',
      }

      try {
        // Выполняем запрос
        const result = await next(context)
        const duration = performance.now() - startTime

        // Отправляем метрики успешного запроса
        sendMetrics({
          ...requestMetrics,
          status: 'success',
          duration,
          resultSize: JSON.stringify(result).length,
        })

        return result
      } catch (error) {
        const duration = performance.now() - startTime

        // Отправляем метрики ошибки
        sendMetrics({
          ...requestMetrics,
          status: 'error',
          duration,
          errorType: error.name,
          errorMessage: error.message,
        })

        throw error
      }
    },
  }
}

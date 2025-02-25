import { ApiEventType } from '../types/api-events.interface'
import { EnhancedApiMiddleware, MiddlewareErrorContext, MiddlewareRequestContext, MiddlewareResponseContext } from '../types/api-middleware.interface'
import { QueryResult, RequestDefinition, RequestOptions } from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'

/**
 * Менеджер middleware для API-запросов
 */
export class MiddlewareManager {
  /** Список middleware с указанием приоритета */
  private middleware: { middleware: EnhancedApiMiddleware; priority: number }[] = []

  /** Функция для генерации событий */
  private emitEvent: (eventType: ApiEventType, eventData: any) => void

  /** Поставщик глобальных опций */
  private globalOptionsProvider: () => Record<string, any> = () => ({})

  /**
   * Создает новый экземпляр менеджера middleware
   * @param emitEvent Функция для генерации событий
   */
  constructor(emitEvent: (eventType: ApiEventType, eventData: any) => void) {
    this.emitEvent = emitEvent
  }

  /**
   * Устанавливает функцию для получения глобальных опций
   * @param provider Функция-поставщик опций
   */
  public setGlobalOptionsProvider(provider: () => Record<string, any>): void {
    this.globalOptionsProvider = provider
  }

  /**
   * Добавляет middleware для обработки запросов
   * @param middleware Объект middleware
   */
  public use(middleware: EnhancedApiMiddleware): void {
    const priority = middleware.options.priority || 0
    this.middleware.push({ middleware, priority })

    // Сортируем middleware по приоритету (от высокого к низкому)
    this.middleware.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Удаляет middleware по имени
   * @param name Имя middleware
   * @returns true если middleware был удален
   */
  public remove(name: string): boolean {
    const initialLength = this.middleware.length
    this.middleware = this.middleware.filter(
      (m) => m.middleware.options.name !== name,
    )
    return initialLength !== this.middleware.length
  }

  /**
   * Удаляет все middleware
   */
  public clear(): void {
    this.middleware = []
  }

  /**
   * Проверяет, должен ли middleware быть применен к запросу
   * @param middleware Объект middleware
   * @param endpointName Имя эндпоинта
   * @param eventType Тип события
   * @returns true если middleware должен быть применен
   */
  private shouldApplyMiddleware(
    middleware: EnhancedApiMiddleware,
    endpointName: string,
    eventType?: ApiEventType,
  ): boolean {
    // Проверяем ограничение по эндпоинтам
    if (middleware.options.endpoints && middleware.options.endpoints.length > 0) {
      if (!middleware.options.endpoints.includes(endpointName)) {
        return false
      }
    }

    // Проверяем ограничение по типам событий (только для onEvent)
    if (eventType && middleware.options.eventTypes && middleware.options.eventTypes.length > 0) {
      if (!middleware.options.eventTypes.includes(eventType)) {
        return false
      }
    }

    return true
  }

  /**
   * Применяет цепочку middleware к запросу
   * @param endpointName Имя эндпоинта
   * @param request Определение запроса
   * @param options Опции запроса
   * @param params Параметры запроса
   * @param endpointMeta Метаданные эндпоинта
   * @returns Модифицированный запрос и опции
   */
  public async applyRequestMiddleware<TParams = any>(
    endpointName: string,
    request: RequestDefinition,
    options: RequestOptions,
    params: TParams,
    endpointMeta?: Record<string, any>,
  ): Promise<{ request: RequestDefinition; options: RequestOptions }> {
    let currentRequest = { ...request }
    let currentOptions = { ...options }

    // Получаем глобальные опции
    const globalOptions = this.globalOptionsProvider()

    // Создаем контекст запроса
    const requestContext: MiddlewareRequestContext<TParams> = {
      endpointName,
      params,
      originalRequest: request,
      originalOptions: options,
      endpointMeta,
      ...globalOptions,
    }

    // Применяем middleware последовательно
    for (const { middleware } of this.middleware) {
      if (!middleware.request || !this.shouldApplyMiddleware(middleware, endpointName)) {
        continue
      }

      try {
        const result = await Promise.resolve(
          middleware.request(currentRequest, currentOptions, requestContext),
        )

        currentRequest = result.request
        currentOptions = result.options
      } catch (error) {
        apiLogger.error(
          `Ошибка в middleware ${middleware.options.name} при обработке запроса:`,
          error,
        )
      }
    }

    return {
      request: currentRequest,
      options: currentOptions,
    }
  }

  /**
   * Применяет цепочку middleware к ответу
   * @param endpointName Имя эндпоинта
   * @param result Результат запроса
   * @param params Параметры запроса
   * @param request Определение запроса
   * @param options Опции запроса
   * @param duration Время выполнения запроса
   * @param fromCache Флаг получения из кэша
   * @param endpointMeta Метаданные эндпоинта
   * @returns Модифицированный результат запроса
   */
  public async applyResponseMiddleware<TParams = any, TResult = any>(
    endpointName: string,
    result: QueryResult<TResult>,
    params: TParams,
    request: RequestDefinition,
    options: RequestOptions,
    duration: number,
    fromCache: boolean,
    endpointMeta?: Record<string, any>,
  ): Promise<QueryResult<TResult>> {
    let currentResult = { ...result }

    // Получаем глобальные опции
    const globalOptions = this.globalOptionsProvider()

    // Создаем контекст ответа
    const responseContext: MiddlewareResponseContext<TParams, TResult> = {
      endpointName,
      params,
      originalRequest: request,
      originalOptions: options,
      duration,
      fromCache,
      result: currentResult,
      endpointMeta,
      ...globalOptions,
    }

    // Применяем middleware последовательно
    for (const { middleware } of this.middleware) {
      if (!middleware.response || !this.shouldApplyMiddleware(middleware, endpointName)) {
        continue
      }

      try {
        const modifiedResult = await Promise.resolve(
          middleware.response<TResult>(currentResult, responseContext),
        )

        currentResult = modifiedResult
      } catch (error) {
        apiLogger.error(
          `Ошибка в middleware ${middleware.options.name} при обработке ответа:`,
          error,
        )
      }
    }

    return currentResult
  }

  /**
   * Применяет цепочку middleware к ошибке
   * @param endpointName Имя эндпоинта
   * @param error Ошибка запроса
   * @param params Параметры запроса
   * @param request Определение запроса
   * @param options Опции запроса
   * @param duration Время выполнения запроса
   * @param endpointMeta Метаданные эндпоинта
   * @returns Обработанная ошибка или результат восстановления
   */
  public async applyErrorMiddleware<TParams = any, TResult = any>(
    endpointName: string,
    error: Error,
    params: TParams,
    request: RequestDefinition,
    options: RequestOptions,
    duration: number,
    endpointMeta?: Record<string, any>,
  ): Promise<Error | QueryResult<TResult>> {
    let currentError = error

    // Получаем глобальные опции
    const globalOptions = this.globalOptionsProvider()

    // Создаем контекст ошибки
    const errorContext: MiddlewareErrorContext<TParams> = {
      endpointName,
      params,
      originalRequest: request,
      originalOptions: options,
      duration,
      error: currentError,
      endpointMeta,
      ...globalOptions,
    }

    // Применяем middleware последовательно
    for (const { middleware } of this.middleware) {
      if (!middleware.error || !this.shouldApplyMiddleware(middleware, endpointName)) {
        continue
      }

      try {
        const result = await Promise.resolve(
          middleware.error<TResult>(currentError, errorContext),
        )

        // Если middleware вернул результат вместо ошибки, прерываем цепочку и возвращаем результат
        if (result && typeof result === 'object' && 'ok' in result) {
          return result as QueryResult<TResult>
        }

        // Иначе продолжаем с обновленной ошибкой
        currentError = result as Error
      } catch (middlewareError) {
        apiLogger.error(
          `Ошибка в middleware ${middleware.options.name} при обработке ошибки:`,
          middlewareError,
        )
      }
    }

    return currentError
  }

  /**
   * Передает событие всем middleware с поддержкой onEvent
   * @param eventType Тип события
   * @param eventData Данные события
   */
  public async notifyEvent(eventType: ApiEventType, eventData: any): Promise<void> {
    const endpointName = eventData.endpointName || ''

    for (const { middleware } of this.middleware) {
      if (!middleware.onEvent || !this.shouldApplyMiddleware(middleware, endpointName, eventType)) {
        continue
      }

      try {
        await Promise.resolve(middleware.onEvent(eventType, eventData))
      } catch (error) {
        apiLogger.error(
          `Ошибка в middleware ${middleware.options.name} при обработке события ${eventType}:`,
          error,
        )
      }
    }
  }
}

import { CacheManager } from './cache-manager'
import { EndpointStateManager } from './endpoint-state-manager'
import { MiddlewareManager } from './middleware-manager'
import { ApiEventType } from '../types/api-events.interface'
import { BaseQueryFn, EndpointConfig, QueryResult, RequestDefinition, RequestOptions } from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'

/**
 * Исполнитель запросов с поддержкой кэширования, middleware и событий
 */
export class RequestExecutor {
  /** Контроллеры отмены для активных запросов */
  private abortControllers: Map<string, AbortController> = new Map()

  /** Базовая функция запроса */
  private baseQuery: BaseQueryFn

  /** Менеджер кэша */
  private cacheManager: CacheManager | null

  /** Менеджер состояния эндпоинтов */
  private stateManager: EndpointStateManager

  /** Менеджер middleware */
  private middlewareManager: MiddlewareManager

  /** Функция для генерации событий */
  private emitEvent: (eventType: ApiEventType, eventData: any) => void

  /**
   * Создает новый экземпляр исполнителя запросов
   * @param baseQuery Базовая функция запроса
   * @param cacheManager Менеджер кэша
   * @param stateManager Менеджер состояния эндпоинтов
   * @param middlewareManager Менеджер middleware
   * @param emitEvent Функция для генерации событий
   */
  constructor(
    baseQuery: BaseQueryFn,
    cacheManager: CacheManager | null,
    stateManager: EndpointStateManager,
    middlewareManager: MiddlewareManager,
    emitEvent: (eventType: ApiEventType, eventData: any) => void,
  ) {
    this.baseQuery = baseQuery
    this.cacheManager = cacheManager
    this.stateManager = stateManager
    this.middlewareManager = middlewareManager
    this.emitEvent = emitEvent
  }

  /**
   * Выполняет запрос с поддержкой кэширования, middleware и событий
   * @param endpointName Имя эндпоинта
   * @param endpointConfig Конфигурация эндпоинта
   * @param params Параметры запроса
   * @param options Опции запроса
   * @returns Результат запроса
   */
  public async executeRequest<TParams, TResult>(
    endpointName: string,
    endpointConfig: EndpointConfig<TParams, TResult>,
    params: TParams,
    options?: RequestOptions,
  ): Promise<TResult> {
    let localAbortController: AbortController | undefined
    const startTime = Date.now()

    try {
      // Получаем определение запроса из конфигурации
      const requestDef = endpointConfig.request(params)

      // Создаем метаданные эндпоинта для передачи в события и middleware
      const endpointMeta = {
        cache: endpointConfig.cache,
        tags: endpointConfig.tags || [],
        invalidatesTags: endpointConfig.invalidatesTags || [],
      }

      // Генерируем событие начала запроса
      this.emitEvent(ApiEventType.REQUEST_START, {
        endpointName,
        params,
        timestamp: startTime,
        context: {
          type: ApiEventType.REQUEST_START,
          headers: options?.headers,
        },
      })

      // Обновляем состояние эндпоинта на loading
      await this.stateManager.updateEndpointState(endpointName, {
        status: 'loading',
        meta: endpointMeta,
      })

      // Проверяем возможность использования кэша
      const shouldUseCache = this.cacheManager?.shouldCache(
        endpointName,
        endpointConfig,
        options,
      ) ?? false

      // Объединяем cacheableHeaderKeys из всех уровней
      const mergedCacheableHeaderKeys = [
        ...(options?.cacheableHeaderKeys || []),
        ...(endpointConfig.cacheableHeaderKeys || []),
      ].filter((value, index, self) => self.indexOf(value) === index)

      const cacheOptions = {
        cacheableHeaderKeys: mergedCacheableHeaderKeys,
        endpointConfig,
      }

      // Проверяем кэш, если кэширование не отключено
      if (shouldUseCache && this.cacheManager) {
        const cachedResult = await this.cacheManager.get<TResult>(
          endpointName,
          requestDef,
          params,
          cacheOptions,
        )

        if (cachedResult) {
          apiLogger.debug(
            `Обнаружены кэшированные данные для ${endpointName}`,
            { tags: endpointConfig.tags },
          )

          // Генерируем событие получения из кэша
          this.emitEvent(ApiEventType.CACHE_HIT, {
            endpointName,
            params,
            result: cachedResult.data,
            timestamp: Date.now(),
            cacheKey: `api:${endpointName}`,
            context: {
              type: ApiEventType.CACHE_HIT,
              fromCache: true,
            },
          })

          // Обновляем состояние с данными из кэша
          await this.stateManager.updateEndpointState(endpointName, {
            status: 'success',
            data: cachedResult.data as TResult,
            meta: endpointMeta,
          })

          try {
            // Применяем middleware для ответа из кэша
            const processedResult = await this.middlewareManager.applyResponseMiddleware<TParams, TResult>(
              endpointName,
              cachedResult,
              params,
              requestDef,
              options || {},
              0, // Запрос из кэша не имеет длительности
              true, // Результат из кэша
              endpointMeta,
            )

            return processedResult.data as TResult
          } catch (middlewareError) {
            apiLogger.error('Ошибка в middleware при обработке кэшированного ответа:', middlewareError)
            return cachedResult.data as TResult
          }
        } else {
          // Генерируем событие отсутствия в кэше
          this.emitEvent(ApiEventType.CACHE_MISS, {
            endpointName,
            params,
            timestamp: Date.now(),
            cacheKey: `api:${endpointName}`,
            context: {
              type: ApiEventType.CACHE_MISS,
            },
          })
        }
      }

      // Создаем AbortController если не передан signal
      let signal = options?.signal

      if (!signal) {
        localAbortController = new AbortController()
        signal = localAbortController.signal
        this.abortControllers.set(endpointName, localAbortController)
      }

      // Объединяем опции запроса
      const mergedOptions = {
        ...options,
        signal,
        cacheableHeaderKeys: mergedCacheableHeaderKeys,
      }

      // Применяем middleware для запроса
      const { request: processedRequest, options: processedOptions } = await this.middlewareManager.applyRequestMiddleware<TParams>(
        endpointName,
        requestDef,
        mergedOptions,
        params,
        endpointMeta,
      )

      // Выполняем запрос с модифицированными параметрами
      const result = await this.baseQuery(
        processedRequest,
        processedOptions,
      )

      // Вычисляем длительность запроса
      const duration = Date.now() - startTime

      // Очищаем контроллер
      if (localAbortController) {
        this.abortControllers.delete(endpointName)
      }

      // Обрабатываем ошибку
      if (result.error) {
        // Применяем middleware для ошибки
        const processedResult = await this.middlewareManager.applyErrorMiddleware<TParams, TResult>(
          endpointName,
          result.error as Error,
          params,
          processedRequest,
          processedOptions,
          duration,
          endpointMeta,
        )

        // Если middleware преобразовал ошибку в успешный результат
        if (processedResult && typeof processedResult === 'object' && 'ok' in processedResult) {
          // Генерируем событие успешного запроса
          this.emitEvent(ApiEventType.REQUEST_SUCCESS, {
            endpointName,
            params,
            result: processedResult.data,
            timestamp: Date.now(),
            duration,
            fromCache: false,
            context: {
              type: ApiEventType.REQUEST_SUCCESS,
              recoveredFromError: true,
            },
          })

          // Обновляем состояние с данными
          await this.stateManager.updateEndpointState(endpointName, {
            status: 'success',
            data: processedResult.data as TResult,
            meta: endpointMeta,
          })

          // Кэшируем результат, если кэширование включено
          if (shouldUseCache && this.cacheManager) {
            await this.cacheManager.set(
              endpointName,
              processedRequest,
              params,
              processedResult as QueryResult<TResult>,
              cacheOptions,
            )
          }

          return processedResult.data as TResult
        }

        // Генерируем событие ошибки запроса
        this.emitEvent(ApiEventType.REQUEST_ERROR, {
          endpointName,
          params,
          error: processedResult,
          timestamp: Date.now(),
          duration,
          context: {
            type: ApiEventType.REQUEST_ERROR,
          },
        })

        // Обновляем состояние с ошибкой
        await this.stateManager.updateEndpointState(endpointName, {
          status: 'error',
          error: processedResult as Error,
          meta: endpointMeta,
        })

        throw processedResult
      }

      // Применяем middleware для успешного ответа
      const processedResult = await this.middlewareManager.applyResponseMiddleware<TParams, TResult>(
        endpointName,
        result as QueryResult<TResult>,
        params,
        processedRequest,
        processedOptions,
        duration,
        false, // Не из кэша
        endpointMeta,
      )

      // Генерируем событие успешного запроса
      this.emitEvent(ApiEventType.REQUEST_SUCCESS, {
        endpointName,
        params,
        result: processedResult.data,
        timestamp: Date.now(),
        duration,
        fromCache: false,
        context: {
          type: ApiEventType.REQUEST_SUCCESS,
        },
      })

      // Обновляем состояние с успешным результатом
      await this.stateManager.updateEndpointState(endpointName, {
        status: 'success',
        data: processedResult.data as TResult,
        meta: endpointMeta,
      })

      // Кэшируем результат, если кэширование включено
      if (shouldUseCache && this.cacheManager) {
        await this.cacheManager.set(
          endpointName,
          processedRequest,
          params,
          processedResult as QueryResult<TResult>,
          cacheOptions,
        )
      }

      return processedResult.data as TResult
    } catch (error) {
      // Очищаем контроллер в случае ошибки
      if (localAbortController) {
        this.abortControllers.delete(endpointName)
      }

      // Вычисляем длительность запроса
      const duration = Date.now() - startTime

      // Генерируем событие ошибки запроса
      this.emitEvent(ApiEventType.REQUEST_ERROR, {
        endpointName,
        params,
        error,
        timestamp: Date.now(),
        duration,
        context: {
          type: ApiEventType.REQUEST_ERROR,
          uncaughtError: true,
        },
      })

      // Обновляем состояние с ошибкой
      await this.stateManager.updateEndpointState(endpointName, {
        status: 'error',
        error: error as Error,
        meta: {
          cache: endpointConfig.cache,
          tags: endpointConfig.tags || [],
          invalidatesTags: endpointConfig.invalidatesTags || [],
        },
      })

      // Инвалидируем кэш при ошибке, если настроено
      if (this.cacheManager
          && typeof this.cacheManager.cacheOptions === 'object'
          && this.cacheManager.cacheOptions.invalidateOnError
          && endpointConfig.tags?.length) {
        await this.cacheManager.invalidateByTags(endpointConfig.tags)
      }

      throw error
    }
  }

  /**
   * Отменяет запрос по имени эндпоинта
   * @param endpointName Имя эндпоинта
   */
  public abortRequest(endpointName: string): void {
    const controller = this.abortControllers.get(endpointName)

    if (controller) {
      try {
        controller.abort()
        this.abortControllers.delete(endpointName)

        // Генерируем событие отмены запроса
        this.emitEvent(ApiEventType.REQUEST_CANCEL, {
          endpointName,
          params: null,
          timestamp: Date.now(),
          reason: 'manual',
          context: {
            type: ApiEventType.REQUEST_CANCEL,
          },
        })
      } catch (error) {
        apiLogger.error(`Ошибка отмены запроса ${endpointName}:`, error)
      }
    }
  }

  /**
   * Отменяет все активные запросы
   */
  public abortAllRequests(): void {
    const endpointNames = Array.from(this.abortControllers.keys())

    this.abortControllers.forEach((controller, endpointName) => {
      try {
        controller.abort()

        // Генерируем событие отмены запроса
        this.emitEvent(ApiEventType.REQUEST_CANCEL, {
          endpointName,
          params: null,
          timestamp: Date.now(),
          reason: 'abort_all',
          context: {
            type: ApiEventType.REQUEST_CANCEL,
          },
        })
      } catch (error) {
        apiLogger.error(`Ошибка отмены запроса ${endpointName}:`, error)
      }
    })

    this.abortControllers.clear()

    if (endpointNames.length > 0) {
      apiLogger.debug(`Отменено ${endpointNames.length} запросов: ${endpointNames.join(', ')}`)
    }
  }
}

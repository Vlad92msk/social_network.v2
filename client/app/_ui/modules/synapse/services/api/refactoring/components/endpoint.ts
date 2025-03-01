import { ApiMiddlewareContext } from '@ui/modules/synapse/services/api/types/api-middleware.interface'
import { RequestState, StateRequest } from '../../types/api.interface'
import { CacheManager } from './cache-manager'
import { EndpointStateManager } from './endpoint-state-manager'
import { EventBus } from './event-bus'
import { MiddlewareManager } from './middleware-manager'
import { RequestExecutor } from './request-executor'
import { QueryStorage } from './query-storage'
import { ApiEventData, ApiEventType } from '../types/api-events.interface'
import {
  EndpointConfig,
  EndpointState,
  RequestOptions,
  Unsubscribe,
} from '../types/api.interface'
import { apiLogger, createUniqueId } from '../utils/api-helpers'

/**
 * Класс эндпоинта для выполнения API-запросов
 */
export class Endpoint<TParams = any, TResult = any> {
  /** Хранит оригинальный метод fetch */
  private originalFetch: (params: TParams, options?: RequestOptions) => StateRequest<TResult>

  /** Хранит оригинальный метод subscribe */
  private originalSubscribe: (callback: (state: EndpointState<TResult>) => void) => Unsubscribe

  /** Публичные методы эндпоинта */
  public fetch: (params: TParams, options?: RequestOptions) => StateRequest<TResult>

  public subscribe: (callback: (state: EndpointState<TResult>) => void) => Unsubscribe

  public getState: () => Promise<EndpointState<TResult>>

  public invalidate: () => Promise<void>

  public reset: () => Promise<void>

  public abort: VoidFunction

  public meta: {
    name: string;
    tags: string[];
    invalidatesTags: string[];
    cache: any;
  }

  /**
   * Создает экземпляр эндпоинта
   * @param endpointName Имя эндпоинта
   * @param endpointConfig Конфигурация эндпоинта
   * @param originalFetch Оригинальный метод fetch
   * @param originalSubscribe Оригинальный метод subscribe
   * @param getStateMethod Метод получения состояния
   * @param invalidateMethod Метод инвалидации кэша
   * @param resetMethod Метод сброса состояния
   * @param abortMethod Метод отмены запроса
   * @param eventBus Менеджер событий
   * @param middlewareManager Менеджер middleware
   */
  private constructor(
    endpointName: string,
    endpointConfig: EndpointConfig<TParams, TResult>,
    originalFetch: (params: TParams, options?: RequestOptions) => StateRequest<TResult>,
    originalSubscribe: (callback: (state: EndpointState<TResult>) => void) => Unsubscribe,
    getStateMethod: () => Promise<EndpointState<TResult>>,
    invalidateMethod: () => Promise<void>,
    resetMethod: () => Promise<void>,
    abortMethod: VoidFunction,
    eventBus: EventBus,
    middlewareManager: MiddlewareManager,
  ) {
    this.originalFetch = originalFetch
    this.originalSubscribe = originalSubscribe
    this.getState = getStateMethod
    this.invalidate = invalidateMethod
    this.reset = resetMethod
    this.abort = abortMethod

    // Инициализируем метаданные эндпоинта
    this.meta = {
      name: endpointName,
      tags: endpointConfig.tags || [],
      invalidatesTags: endpointConfig.invalidatesTags || [],
      cache: endpointConfig.cache || {},
    }

    // Переопределяем subscribe для эндпоинта, чтобы использовать систему событий
    this.subscribe = (callback): Unsubscribe => {
      // Используем как оригинальную подписку для состояния, так и систему событий
      const unsubscribeOriginal = this.originalSubscribe.call(this, callback)
      const unsubscribeEvents = eventBus.subscribeEndpoint(this.meta.name, (data: ApiEventData) => {
        // Передаем в callback только данные, которые связаны с изменением состояния
        if (data.context?.type === ApiEventType.REQUEST_START
          || data.context?.type === ApiEventType.REQUEST_SUCCESS
          || data.context?.type === ApiEventType.REQUEST_ERROR) {
          // @ts-ignore
          callback(data)
        }
      })

      // Возвращаем функцию для отписки от обоих источников
      return () => {
        unsubscribeOriginal()
        unsubscribeEvents()
      }
    }

    // Переопределяем fetch для поддержки контекста, событий и middleware
    this.fetch = (params: TParams, requestOptions: RequestOptions = {}): StateRequest<TResult> => {
      const id = createUniqueId()
      const startTime = performance.now()
      const listeners = new Set<(state: RequestState<TResult>) => void>()

      const promise = (async () => {
        try {
          // Отправляем событие начала запроса
          eventBus.emit(ApiEventType.REQUEST_START, {
            type: ApiEventType.REQUEST_START,
            endpointName: this.meta.name,
            params,
            timestamp: Date.now(),
            requestId: id,
            context: {
              type: ApiEventType.REQUEST_START,
              tag: this.meta.tags.length > 0 ? this.meta.tags[0] : undefined,
            },
          })

          // Выполняем запрос через middleware
          const middlewareContext: ApiMiddlewareContext = {
            endpointName: this.meta.name,
            params,
            options: requestOptions,
            requestId: id,
            originalFetch: (p, o) => {
              const stateRequest = this.originalFetch.call(this, p, o)
              return stateRequest.wait()
            },
            client: null, // Будет установлено в ApiClient
          }

          // Здесь должна быть обработка через middleware manager
          // Для совместимости пока используем прямой вызов
          const result = await this.originalFetch.call(this, params, requestOptions).wait()

          // Отправляем событие успешного запроса
          eventBus.emit(ApiEventType.REQUEST_SUCCESS, {
            type: ApiEventType.REQUEST_SUCCESS,
            endpointName: this.meta.name,
            params,
            result,
            timestamp: Date.now(),
            duration: performance.now() - startTime,
            requestId: id,
            fromCache: false, // TODO: получать из результата
            context: {
              type: ApiEventType.REQUEST_SUCCESS,
              tag: this.meta.tags.length > 0 ? this.meta.tags[0] : undefined,
            },
          })

          // Уведомляем слушателей об успешном результате
          listeners.forEach((listener) => {
            listener({ status: 'success', data: result })
          })

          return result
        } catch (error) {
          // Отправляем событие ошибки
          eventBus.emit(ApiEventType.REQUEST_ERROR, {
            type: ApiEventType.REQUEST_ERROR,
            endpointName: this.meta.name,
            params,
            error: error as Error,
            timestamp: Date.now(),
            duration: performance.now() - startTime,
            requestId: id,
            context: {
              type: ApiEventType.REQUEST_ERROR,
              tag: this.meta.tags.length > 0 ? this.meta.tags[0] : undefined,
            },
          })

          // Уведомляем слушателей об ошибке
          listeners.forEach((listener) => {
            listener({ status: 'error', error: error as Error })
          })

          throw error
        }
      })()

      return {
        id,
        subscribe: (listener) => {
          listeners.add(listener)
          listener({ status: 'loading' })

          return () => {
            listeners.delete(listener)
          }
        },
        wait: () => promise,
      }
    }
  }

  /**
   * Фабричный метод для создания экземпляра эндпоинта
   * @param params Параметры инициализации эндпоинта
   * @returns Экземпляр эндпоинта
   */
  public static async create<TParams, TResult>({
    endpointName,
    endpointConfig,
    stateManager,
    storageManager,
    cacheManager,
    requestExecutor,
    eventManager,
    middlewareManager,
  }: {
    endpointName: string,
    endpointConfig: EndpointConfig<TParams, TResult>,
    stateManager: EndpointStateManager,
    storageManager: QueryStorage,
    cacheManager: CacheManager | null,
    requestExecutor: RequestExecutor,
    eventManager: EventBus,
    middlewareManager: MiddlewareManager,
  }): Promise<Endpoint<TParams, TResult>> {
    // Инициализируем начальное состояние
    const initialState: EndpointState<TResult> = {
      status: 'idle',
      meta: {
        tags: endpointConfig.tags || [],
        invalidatesTags: endpointConfig.invalidatesTags || [],
        cache: endpointConfig.cache || {},
      },
    }

    // Сохраняем начальное состояние в менеджере состояний
    await stateManager.updateEndpointState(endpointName, initialState)

    // Регистрируем теги эндпоинта в cacheManager, если кэширование включено
    if (cacheManager && endpointConfig.tags?.length && typeof cacheManager.cacheOptions === 'object') {
      cacheManager.cacheOptions.tags = cacheManager.cacheOptions.tags || {}
      cacheManager.cacheOptions.tags[endpointName] = [...endpointConfig.tags]
    }

    // Создаем базовую версию оригинального fetch
    const originalFetch = (params: TParams, options?: RequestOptions): StateRequest<TResult> => {
      const id = createUniqueId()
      const listeners = new Set<(state: RequestState<TResult>) => void>()

      const promise = requestExecutor.executeRequest(
        endpointName,
        endpointConfig,
        params,
        options,
      )

      // Создаем объект запроса с методами
      const request: StateRequest<TResult> = {
        id,
        subscribe: (listener) => {
          listeners.add(listener)
          listener({ status: 'loading' })

          promise
            .then((result) => {
              listener({ status: 'success', data: result })
            })
            .catch((error) => {
              listener({ status: 'error', error: error as Error })
            })

          return () => listeners.delete(listener)
        },
        wait: () => promise,
      }

      return request
    }

    // Создаем базовые методы для эндпоинта
    const originalSubscribe = (callback: (state: EndpointState<TResult>) => void): Unsubscribe => stateManager.subscribeToState(endpointName, callback)

    const getStateMethod = async (): Promise<EndpointState<TResult>> => stateManager.getEndpointState<TResult>(endpointName)

    const invalidateMethod = async (): Promise<void> => {
      // Инвалидируем кэш по тегам эндпоинта
      if (cacheManager && endpointConfig.invalidatesTags?.length) {
        await cacheManager.invalidateByTags(endpointConfig.invalidatesTags)
      }

      // Сбрасываем состояние
      await stateManager.updateEndpointState(endpointName, {
        ...initialState,
        status: 'idle',
      })
    }

    const resetMethod = async (): Promise<void> => {
      await stateManager.updateEndpointState(endpointName, initialState)
    }

    const abortMethod = (): void => {
      requestExecutor.abortRequest(endpointName)
    }

    // Создаем экземпляр эндпоинта
    return new Endpoint<TParams, TResult>(
      endpointName,
      endpointConfig,
      originalFetch,
      originalSubscribe,
      getStateMethod,
      invalidateMethod,
      resetMethod,
      abortMethod,
      eventManager,
      middlewareManager,
    )
  }
}

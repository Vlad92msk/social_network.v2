import { ApiCache } from './api-cache'
import { ApiClient } from './api-client'
import { ApiEventManager } from './api-event-manager'
import { ApiMiddlewareManager } from './api-middleware-manager'
import { EndpointStateManager } from './endpoint-state-manager'
import { RequestExecutor } from './request-executor'
import { StorageManager } from './storage-manager'
import { ApiEventData, RequestErrorEventData, RequestStartEventData, RequestSuccessEventData } from '../types/api-events.interface'
import { ApiMiddlewareContext } from '../types/api-middleware.interface'
import {
  EndpointConfig,
  EndpointState,
  Endpoint as EndpointType,
  RequestOptions,
  RequestState,
  StateRequest,
  Unsubscribe,
} from '../types/api.interface'
import { createUniqueId } from '../utils/api-helpers'

export class Endpoint<TParams, TResult> {
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

  public meta: EndpointType['meta']

  /**
   * Создает новый экземпляр эндпоинта
   * @param endpointName Имя эндпоинта
   * @param endpointConfig Конфигурация эндпоинта
   * @param originalFetch Оригинальный метод fetch
   * @param originalSubscribe Оригинальный метод subscribe
   * @param stateManager Менеджер состояния
   * @param eventManager Менеджер событий
   * @param middlewareManager Менеджер middleware
   * @param initialState Начальное состояние эндпоинта
   */
  constructor(
    endpointName: string,
    endpointConfig: EndpointConfig<TParams, TResult>,
    originalFetch: (params: TParams, options?: RequestOptions) => StateRequest<TResult>,
    originalSubscribe: (callback: (state: EndpointState<TResult>) => void) => Unsubscribe,
    getStateMethod: () => Promise<EndpointState<TResult>>,
    invalidateMethod: () => Promise<void>,
    resetMethod: () => Promise<void>,
    abortMethod: VoidFunction,
    eventManager: ApiEventManager,
    middlewareManager: ApiMiddlewareManager,
    initialState: EndpointState<TResult>,
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
      const unsubscribeEvents = eventManager.onEndpoint(this.meta.name, (data: ApiEventData) => {
        // Передаем в callback только данные, которые связаны с изменением состояния
        if (data.context?.type === 'request:start'
          || data.context?.type === 'request:success'
          || data.context?.type === 'request:error') {
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

      const promise = (async () => {
        try {
          // Отправляем событие начала запроса
          const startEventData: RequestStartEventData = {
            type: 'request:start',
            endpointName: this.meta.name,
            params,
            requestId: id,
            tags: this.meta.tags,
            context: {
              type: 'request:start',
            },
          }

          eventManager.emitGroupEvents(
            'request:start',
            startEventData,
            'request:start',
            this.meta.tags,
          )

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
            client: null, // Будет установлен в ApiClient
          }

          const result = await middlewareManager.execute(middlewareContext)

          // Отправляем событие успешного запроса
          const successEventData: RequestSuccessEventData = {
            type: 'request:success',
            endpointName: this.meta.name,
            params,
            result,
            duration: performance.now() - startTime,
            requestId: id,
            fromCache: false, // TODO: получать из результата middleware
            tags: this.meta.tags,
            context: {
              type: 'request:success',
            },
          }

          eventManager.emitGroupEvents(
            'request:success',
            successEventData,
            'request:success',
            this.meta.tags,
          )

          return result
        } catch (error) {
          // Отправляем событие ошибки
          const errorEventData: RequestErrorEventData = {
            type: 'request:error',
            endpointName: this.meta.name,
            params,
            error: error as Error,
            duration: performance.now() - startTime,
            requestId: id,
            tags: this.meta.tags,
            context: {
              type: 'request:error',
            },
          }

          eventManager.emitGroupEvents(
            'request:error',
            errorEventData,
            'request:error',
            this.meta.tags,
          )

          throw error
        }
      })()

      return {
        id,
        subscribe: (listener) => {
          listener({ status: 'loading' })

          const unsubscribeFromEvents = eventManager.onEndpoint(this.meta.name, (data: ApiEventData) => {
            if (data.type === 'request:success' && data.requestId === id) {
              listener({ status: 'success', data: data.result })
            } else if (data.type === 'request:error' && data.requestId === id) {
              listener({ status: 'error', error: data.error })
            }
          })

          return unsubscribeFromEvents
        },
        wait: () => promise,
      }
    }
  }

  /**
   * Создает новый экземпляр эндпоинта
   * @param endpointConfig Параметры создания эндпоинта
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
    client,
  }: {
    endpointName: string,
    endpointConfig: EndpointConfig<TParams, TResult>,
    stateManager: EndpointStateManager,
    storageManager: StorageManager,
    cacheManager: ApiCache | null,
    requestExecutor: RequestExecutor,
    eventManager: ApiEventManager,
    middlewareManager: ApiMiddlewareManager,
    client: ApiClient<any>,
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

    // Сохраняем начальное состояние в хранилище
    try {
      await storageManager.set(`endpoint:${endpointName}`, initialState)
    } catch (error) {
      console.error(`Failed to save initial state for endpoint ${endpointName}:`, error)
      throw error
    }

    // Регистрируем теги эндпоинта в cacheManager, если кэширование включено
    if (cacheManager && endpointConfig.tags?.length) {
      cacheManager.registerTags(endpointName, endpointConfig.tags)
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

      // Создаем объект с необходимыми методами
      const request: StateRequest<TResult> = {
        id,
        subscribe: (listener) => {
          listeners.add(listener)
          listener({ status: 'loading' })

          promise
            .then((result: TResult) => listener({ status: 'success', data: result }))
            .catch((error: Error) => listener({ status: 'error', error }))

          return () => listeners.delete(listener)
        },
        wait: () => promise,
      }
      return request
    }

    // Создаем базовые методы для эндпоинта
    const originalSubscribe = (callback: (state: EndpointState<TResult>) => void): Unsubscribe => stateManager.subscribeToEndpointState(endpointName, callback)

    const getStateMethod = async (): Promise<EndpointState<TResult>> => stateManager.getEndpointState(endpointName, initialState)

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
    const endpoint = new Endpoint<TParams, TResult>(
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
      initialState,
    )

    return endpoint
  }
}

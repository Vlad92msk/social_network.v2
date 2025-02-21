import { ApiCache, Endpoint, EndpointConfig, EndpointState, RequestOptions } from '..'
import { EndpointStateManager } from './endpoint-state-manager'
import { RequestExecutor } from './request-executor'
import { StorageManager } from './storage-manager'
import { Unsubscribe } from '../types/api.interface'
import { createUniqueId } from '../utils/api-helpers'

// 4. EndpointFactory.ts - фабрика для создания эндпоинтов
export class EndpointFactory {
  constructor(
    private storageManager: StorageManager,
    private stateManager: EndpointStateManager,
    private requestExecutor: RequestExecutor,
    private cacheManager: ApiCache | null,
  ) {}

  public async createEndpoint<TParams, TResult>(
    nameOrConfig: string | EndpointConfig<TParams, TResult>,
    config?: EndpointConfig<TParams, TResult>,
  ): Promise<Endpoint<TParams, TResult>> {
    // Нормализуем параметры
    const name = typeof nameOrConfig === 'string' ? nameOrConfig : ''
    const endpointConfig = typeof nameOrConfig === 'string'
      ? (config as EndpointConfig<TParams, TResult>)
      : (nameOrConfig as EndpointConfig<TParams, TResult>)
    const endpointName = name || `endpoint_${createUniqueId()}`

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
    await this.storageManager.set(`endpoint:${endpointName}`, initialState)

    // Регистрируем теги эндпоинта в cacheManager, если кэширование включено
    if (this.cacheManager && endpointConfig.tags?.length) {
      this.cacheManager.registerTags(endpointName, endpointConfig.tags)
    }

    // Создаем эндпоинт
    const endpoint: Endpoint<TParams, TResult> = {
      // Метод выполнения запроса
      fetch: (params: TParams, options?: RequestOptions): Promise<TResult> => this.requestExecutor.executeRequest(
        endpointName,
        endpointConfig,
        params,
        options,
      ),

      // Подписка на изменения состояния
      subscribe: (callback): Unsubscribe => this.stateManager.subscribeToEndpointState(endpointName, callback),

      // Получение текущего состояния
      getState: async (): Promise<EndpointState<TResult>> => this.stateManager.getEndpointState(endpointName, initialState),

      // Инвалидация кэша по тегам
      invalidate: async (): Promise<void> => {
        // Инвалидируем кэш по тегам эндпоинта
        if (this.cacheManager && endpointConfig.invalidatesTags?.length) {
          await this.cacheManager.invalidateByTags(endpointConfig.invalidatesTags)
        }

        // Сбрасываем состояние
        await this.stateManager.updateEndpointState(endpointName, {
          ...initialState,
          status: 'idle',
        })
      },

      // Сброс состояния эндпоинта
      reset: async (): Promise<void> => {
        await this.stateManager.updateEndpointState(endpointName, initialState)
      },

      // Отмена текущего запроса
      abort: (): void => {
        this.requestExecutor.abortRequest(endpointName)
      },

      // Метаданные эндпоинта
      meta: {
        name: endpointName,
        tags: endpointConfig.tags || [],
        invalidatesTags: endpointConfig.invalidatesTags || [],
        cache: endpointConfig.cache || {},
      },
    }

    return endpoint
  }
}

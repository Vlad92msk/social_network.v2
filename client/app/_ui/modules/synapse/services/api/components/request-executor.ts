import { EndpointConfig, RequestOptions } from '..'
import { ApiCache } from './api-cache'
import { EndpointStateManager } from './endpoint-state-manager'
import { BaseQueryFn } from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'

export class RequestExecutor {
  private abortControllers: Map<string, AbortController> = new Map()

  constructor(
    private baseQuery: BaseQueryFn,
    private cacheManager: ApiCache | null,
    private stateManager: EndpointStateManager,
  ) {}

  public async executeRequest<TParams, TResult>(
    endpointName: string,
    endpointConfig: EndpointConfig<TParams, TResult>,
    params: TParams,
    options?: RequestOptions,
  ): Promise<TResult> {
    let localAbortController: AbortController | undefined

    try {
      const shouldUseCache = this.shouldUseCache(endpointName, options, endpointConfig)

      // Объединяем cacheableHeaderKeys из всех уровней
      const mergedCacheableHeaderKeys = [
        ...(options?.cacheableHeaderKeys || []),
        ...(endpointConfig.cacheableHeaderKeys || []),
      ].filter((value, index, self) => self.indexOf(value) === index)

      // Получаем определение запроса
      const requestDef = endpointConfig.request(params)

      // Проверяем кэш, если кэширование не отключено
      if (shouldUseCache && this.cacheManager) {
        // Передаем mergedCacheableHeaderKeys при проверке кеша
        const cachedResult = await this.cacheManager.get<TResult>(
          endpointName,
          requestDef,
          params,
          { cacheableHeaderKeys: mergedCacheableHeaderKeys },
        )

        if (cachedResult) {
          apiLogger.debug(
            `Обнаружены кэшированные данные для ${endpointName}`,
            { tags: endpointConfig.tags },
          )

          // Обновляем состояние с данными из кэша
          await this.stateManager.updateEndpointState(endpointName, {
            status: 'success',
            data: cachedResult.data as TResult,
          })

          return cachedResult.data as TResult
        }
      }

      // Обновляем состояние на loading
      await this.stateManager.updateEndpointState(endpointName, {
        status: 'loading',
      })

      // Создаем AbortController если не передан signal
      let signal = options?.signal

      if (!signal) {
        localAbortController = new AbortController()
        signal = localAbortController.signal
        this.abortControllers.set(endpointName, localAbortController)
      }

      // Объединяем cacheableHeaderKeys из опций запроса и из конфигурации эндпоинта
      const mergedOptions = {
        ...options,
        signal,
        cacheableHeaderKeys: mergedCacheableHeaderKeys,
      }

      console.log('mergedOptions', mergedOptions)
      // Выполняем запрос с объединенными опциями
      const result = await this.baseQuery(requestDef, mergedOptions)

      // Очищаем контроллер
      if (localAbortController) {
        this.abortControllers.delete(endpointName)
      }

      // Обрабатываем результат
      if (result.error) {
        // Обновляем состояние с ошибкой
        await this.stateManager.updateEndpointState(endpointName, {
          status: 'error',
          error: result.error as Error,
        })

        throw result.error
      }

      // Обновляем состояние с успешным результатом
      await this.stateManager.updateEndpointState(endpointName, {
        status: 'success',
        data: result.data as TResult,
      })

      // Кэшируем результат, если кэширование не отключено
      if (shouldUseCache && this.cacheManager) {
        console.log('Caching result with headers:', result.metadata?.cacheableHeaders)
        console.log('Merged cacheable header keys:', mergedCacheableHeaderKeys)

        // Создаем новый результат с полными метаданными
        const enhancedResult = {
          data: result.data,
          // Преобразуем headers в обычный объект
          // @ts-ignore
          headers: Object.fromEntries(result.headers.entries()),
          status: result.status,
          ok: result.ok,
          metadata: {
            ...result.metadata,
            cacheableHeaderKeys: mergedCacheableHeaderKeys,
          },
        }

        // Передаем объект с полными метаданными и ключи заголовков
        await this.cacheManager.set(
          endpointName,
          requestDef,
          params,
          enhancedResult,
          { cacheableHeaderKeys: mergedCacheableHeaderKeys },
        )
      }

      return result.data as TResult
    } catch (error) {
      // Очищаем контроллер в случае ошибки
      if (localAbortController) {
        this.abortControllers.delete(endpointName)
      }

      // Обновляем состояние с ошибкой
      await this.stateManager.updateEndpointState(endpointName, {
        status: 'error',
        error: error as Error,
      })

      // Инвалидируем кэш при ошибке, если настроено
      if (this.cacheManager
        && this.cacheManager.cacheOptions
        && typeof this.cacheManager.cacheOptions === 'object'
        && this.cacheManager.cacheOptions.invalidateOnError
        && endpointConfig.tags?.length) {
        await this.cacheManager.invalidateByTags(endpointConfig.tags)
      }

      throw error
    }
  }

  private shouldUseCache(endpointName: string, options?: RequestOptions, endpointConfig?: EndpointConfig): boolean {
    // Если кэш-менеджер недоступен, возвращаем false
    if (!this.cacheManager) return false

    // Если в опциях запроса отключено кэширование, возвращаем false
    if (options?.disableCache) return false

    // Если в конфигурации эндпоинта явно отключено кэширование
    if (endpointConfig?.cache === false) return false

    // Если в конфигурации эндпоинта явно включено кэширование
    if (endpointConfig?.cache === true) return true

    // Проверяем правила кэширования в кэш-менеджере
    return this.cacheManager.shouldCache(endpointName)
  }

  public abortRequest(endpointName: string): void {
    const controller = this.abortControllers.get(endpointName)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(endpointName)
    }
  }

  public abortAllRequests(): void {
    this.abortControllers.forEach((controller) => {
      try {
        controller.abort()
      } catch (error) {
        apiLogger.error('Ошибка отмены запроса', error)
      }
    })
    this.abortControllers.clear()
  }
}

// base-storage.service.ts
import { Middleware, MiddlewareOptions, StorageContext } from '../../core/core.interface'
import type { Event, IEventBus } from '../../event-bus/event-bus.interface'
import type { ILogger } from '../../logger/logger.interface'
import { BatchingMiddlewareOptions, createBatchingMiddleware, createShallowCompareMiddleware, ShallowCompareMiddlewareOptions } from '../middlewares'
import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import { IStorage, IStorageConfig, StorageEvents } from '../storage.interface'
import { MiddlewareChain } from '../utils/middleware-chain.utils'

export interface DefaultMiddlewareOptions extends MiddlewareOptions {
  batching?: BatchingMiddlewareOptions | false
  shallowCompare?: ShallowCompareMiddlewareOptions | false
}

export abstract class BaseStorage implements IStorage {
  private middlewareChain: MiddlewareChain

  protected subscribers = new Map<string, Set<(value: any) => void>>()

  constructor(
    protected readonly config: IStorageConfig,
    protected readonly pluginManager: IPluginExecutor,
    protected readonly eventBus: IEventBus,
    protected readonly logger: ILogger,
  ) {
    this.middlewareChain = new MiddlewareChain(
      this.getDefaultMiddleware.bind(this),
      config,
    )
  }

  // Абстрактные методы для реализации в конкретных хранилищах
  protected abstract doGet(key: string): Promise<any>;

  protected abstract doSet(key: string, value: any): Promise<void>;

  protected abstract doDelete(key: string): Promise<boolean>;

  protected abstract doClear(): Promise<void>;

  protected abstract doKeys(): Promise<string[]>;

  protected abstract doHas(key: string): Promise<boolean>;

  protected abstract doDestroy(): Promise<void>;

  // Реализация публичного API
  public async get<T>(key: string): Promise<T | undefined> {
    try {
      const processedKey = this.pluginManager.executeBeforeGet(key)

      const value = await this.applyMiddlewares({
        type: 'get',
        key: processedKey,
      }) as T | undefined

      const processedValue = this.pluginManager.executeAfterGet(processedKey, value)

      await this.emitEvent({
        type: StorageEvents.STORAGE_SELECT,
        payload: { key: processedKey, value: processedValue },
      })

      return processedValue
    } catch (error) {
      this.logger.error('Error getting value', { key, error })
      throw error
    }
  }

  public async set<T>(key: string, value: T): Promise<void> {
    try {
      const processedValue = this.pluginManager.executeBeforeSet(key, value)

      await this.applyMiddlewares({
        type: 'set',
        key,
        value: processedValue,
      })

      this.pluginManager.executeAfterSet(key, processedValue)

      // Уведомляем подписчиков
      this.notifySubscribers(key, processedValue)

      await this.emitEvent({
        type: StorageEvents.STORAGE_UPDATE,
        payload: { key, value: processedValue },
      })

      this.logger.debug('Value set successfully', { key })
    } catch (error) {
      this.logger.error('Error setting value', { key, error })
      throw error
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      if (this.pluginManager.executeBeforeDelete(key)) {
        await this.applyMiddlewares({
          type: 'delete',
          key,
        })

        this.pluginManager.executeAfterDelete(key)

        await this.emitEvent({
          type: 'storage:value:deleted',
          payload: { key },
        })

        this.logger.debug('Value deleted successfully', { key })
      }
    } catch (error) {
      this.logger.error('Error deleting value', { key, error })
      throw error
    }
  }

  protected notifySubscribers(key: string, value: any): void {
    console.log('Notifying subscribers for:', key, value)
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach((callback) => callback(value))
    }
  }

  public subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(callback)

    return () => {
      const subscribers = this.subscribers.get(key)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(key)
        }
      }
    }
  }

  public async clear(): Promise<void> {
    try {
      this.pluginManager.executeOnClear()

      await this.applyMiddlewares({
        type: 'clear',
      })

      await this.doClear()

      await this.emitEvent({
        type: StorageEvents.STORAGE_CLEAR,
      })

      this.logger.debug('Storage cleared successfully')
    } catch (error) {
      this.logger.error('Error clearing storage', { error })
      throw error
    }
  }

  public async keys(): Promise<string[]> {
    return this.applyMiddlewares({ type: 'keys' })
  }

  public async has(key: string): Promise<boolean> {
    try {
      return await this.doHas(key)
    } catch (error) {
      this.logger.error('Error checking value existence', { key, error })
      throw error
    }
  }

  // Защищенные методы для внутреннего использования
  protected getDefaultMiddleware(options?: DefaultMiddlewareOptions): Middleware[] {
    const middlewares: Middleware[] = []

    // Добавляем equality check middleware
    if (options?.shallowCompare !== false) {
      const equalityOptions = options?.shallowCompare || {}
      middlewares.push(
        createShallowCompareMiddleware(equalityOptions),
      )
    }

    // Добавляем батчинг middleware если он не отключен
    if (options?.batching !== false) {
      const batchingOptions = options?.batching || {}
      middlewares.push(
        createBatchingMiddleware({
          batchSize: batchingOptions.batchSize || 100,
          batchDelay: batchingOptions.batchDelay || 50,
          segments: batchingOptions.segments || [],
        }),
      )
    }

    // В будущем можно добавить другие базовые middleware
    // например для сериализации, валидации и т.д.

    return middlewares
  }

  private createBaseOperation() {
    return async (ctx: StorageContext) => {
      switch (ctx.type) {
        case 'get':
          return this.doGet(ctx.key!)
        case 'set':
          await this.doSet(ctx.key!, ctx.value)
          return ctx.value
        case 'delete':
          return this.doDelete(ctx.key!)
        case 'clear':
          await this.doClear()
          return
        case 'keys':
          return this.doKeys()
        default:
          throw new Error(`Unknown operation: ${ctx.type}`)
      }
    }
  }

  protected async applyMiddlewares(context: StorageContext): Promise<any> {
    // Извлекаем сегмент из ключа, если он есть
    const segment = context.key?.split('.')[0]

    return this.middlewareChain.execute({
      ...context,
      segment,
      baseOperation: this.createBaseOperation(),
    })
  }

  protected async emitEvent(event: Event): Promise<void> {
    try {
      await this.eventBus.emit({
        ...event,
        metadata: {
          ...(event.metadata || {}),
          timestamp: Date.now(),
          storageType: this.config.type || 'memory',
        },
      })
    } catch (error) {
      this.logger.error('Error emitting event', { event, error })
    }
  }

  public async destroy(): Promise<void> {
    try {
      // Очищаем данные
      await this.clear()

      // Вызываем специфичную очистку
      await this.doDestroy()

      // Отправляем событие о уничтожении
      await this.emitEvent({
        type: 'storage:destroyed',
        payload: { type: this.config.type },
      })
    } catch (error) {
      this.logger.error('Error destroying storage', { error })
      throw error
    }
  }
}

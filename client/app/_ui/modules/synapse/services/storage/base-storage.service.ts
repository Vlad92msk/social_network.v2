// base-storage.service.ts
import { BatchingMiddlewareOptions, createBatchingMiddleware, createShallowCompareMiddleware, ShallowCompareMiddlewareOptions } from './middlewares'
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { Middleware, MiddlewareOptions, StorageContext } from '../core/core.interface'
import type { Event, IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

export interface DefaultMiddlewareOptions extends MiddlewareOptions {
  batching?: BatchingMiddlewareOptions | false
  shallowCompare?: ShallowCompareMiddlewareOptions | false
  // В будущем можно добавлять опции для других базовых middleware:
  // validation?: ValidationMiddlewareOptions | false
  // serialization?: SerializationMiddlewareOptions | false
  // и т.д.
}

export abstract class BaseStorage implements IStorage {
  constructor(
    protected readonly config: IStorageConfig,
    protected readonly pluginManager: StoragePluginManager,
    protected readonly eventBus: IEventBus,
    protected readonly logger: ILogger,
  ) {}

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
        type: 'storage:value:accessed',
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

      await this.emitEvent({
        type: 'storage:value:changed',
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

  public async clear(): Promise<void> {
    try {
      this.pluginManager.executeOnClear()

      await this.applyMiddlewares({
        type: 'clear',
      })

      await this.doClear()

      await this.emitEvent({
        type: 'storage:cleared',
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

  protected async applyMiddlewares(context: StorageContext): Promise<any> {
    const middlewares = this.config.middlewares?.(
      (options) => this.getDefaultMiddleware(options),
    ) || []

    const baseOperation = async (ctx: StorageContext) => {
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

    const handler = middlewares.reduceRight(
      (next, middleware) => middleware(next),
      baseOperation,
    )

    return handler(context)
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

// const storage = await StorageModule.create({
//   type: 'indexDB',
//   name: 'user',
//   initialState: {
//     sum: 30
//   },
//   middlewares: (getDefaultMiddleware) => [
//     ...getDefaultMiddleware({
//       equalityCheck: {
//         segments: ['user'],
//         // Можно передать свой компаратор для сложных объектов
//         comparator: (prev, next) => deepEqual(prev, next)
//       },
//       batching: {
//         segments: ['user', 'cache'] // батчинг только для этих сегментов
//         batchSize: 100,
//         batchDelay: 50,
//       },
//     })
//   ]
// })

// Это не вызовет обновление состояния
// await segment.setByPath('sum', 30)

// А это вызовет
// await segment.setByPath('sum', 35)

//
//
// const storage = await StorageModule.create({
//   type: 'indexDB',
//   middlewares: (getDefaultMiddleware) => [
//     ...getDefaultMiddleware({
//       batching: false,
//     })
//   ]
// })

import { createBatchingMiddleware, createShallowCompareMiddleware } from '../middlewares'
import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import {
  DefaultMiddlewareOptions,
  IEventEmitter,
  ILogger,
  IStorage,
  Middleware,
  StorageConfig,
  StorageContext,
  StorageEvent,
  StorageEvents,
} from '../storage.interface'
import { MiddlewareChain } from '../utils/middleware-chain.utils'

export abstract class BaseStorage implements IStorage {
  // Константа для глобальной подписки
  protected static readonly GLOBAL_SUBSCRIPTION_KEY = '*'

  name: string

  private middlewareChain: MiddlewareChain

  protected subscribers = new Map<string, Set<(value: any) => void>>()

  constructor(
    protected readonly config: StorageConfig,
    protected readonly pluginExecutor?: IPluginExecutor,
    protected readonly eventEmitter?: IEventEmitter,
    protected readonly logger?: ILogger,
  ) {
    this.name = config.name
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

  public async get<T>(key: string): Promise<T | undefined> {
    try {
      const processedKey = this.pluginExecutor?.executeBeforeGet(key) ?? key

      const value = await this.applyMiddlewares({
        type: 'get',
        key: processedKey,
      }) as T | undefined

      const processedValue = this.pluginExecutor?.executeAfterGet(processedKey, value) ?? value

      await this.emitEvent({
        type: StorageEvents.STORAGE_SELECT,
        payload: { key: processedKey, value: processedValue },
      })

      return processedValue
    } catch (error) {
      this.logger?.error('Error getting value', { key, error })
      throw error
    }
  }

  public async set<T>(key: string, value: T): Promise<void> {
    try {
      const processedValue = this.pluginExecutor?.executeBeforeSet(key, value) ?? value

      await this.applyMiddlewares({
        type: 'set',
        key,
        value: processedValue,
      })

      this.pluginExecutor?.executeAfterSet(key, processedValue)
      // Уведомляем подписчиков конкретного ключа
      this.notifySubscribers(key, processedValue)

      // Уведомляем глобальных подписчиков
      if (this.subscribers.has(BaseStorage.GLOBAL_SUBSCRIPTION_KEY)) {
        this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
          type: 'set',
          key,
          value: processedValue,
        })
      }

      await this.emitEvent({
        type: StorageEvents.STORAGE_UPDATE,
        payload: { key, value: processedValue },
      })

      this.logger?.debug('Value set successfully', { key })
    } catch (error) {
      this.logger?.error('Error setting value', { key, error })
      throw error
    }
  }

  public async update(updater: (state: any) => void): Promise<void> {
    try {
      // Получаем текущее состояние
      const currentState = await this.getState()

      // Создаем копию для изменений
      const newState = { ...currentState }

      // Применяем обновление
      updater(newState)

      // Для каждого измененного пути применяем set
      for (const key of Object.keys(currentState)) {
        if (!this.isEqual(currentState[key], newState[key])) {
          await this.set(key, newState[key])
        }
      }

      // Уведомляем глобальных подписчиков
      if (this.subscribers.has(BaseStorage.GLOBAL_SUBSCRIPTION_KEY)) {
        this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
          type: StorageEvents.STORAGE_UPDATE,
          value: newState,
        })
      }

      await this.emitEvent({
        type: StorageEvents.STORAGE_UPDATE,
        payload: { state: newState },
      })
    } catch (error) {
      this.logger?.error('Error updating state', { error })
      throw error
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      if (this.pluginExecutor?.executeBeforeDelete(key)) {
        await this.applyMiddlewares({
          type: 'delete',
          key,
        })

        this.pluginExecutor?.executeAfterDelete(key)

        // Уведомляем глобальных подписчиков
        if (this.subscribers.has(BaseStorage.GLOBAL_SUBSCRIPTION_KEY)) {
          this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
            type: 'delete',
            key,
          })
        }

        await this.emitEvent({
          type: StorageEvents.STORAGE_DELETE,
          payload: { key },
        })

        this.logger?.debug('Value deleted successfully', { key })
      }
    } catch (error) {
      this.logger?.error('Error deleting value', { key, error })
      throw error
    }
  }

  public async clear(): Promise<void> {
    try {
      this.pluginExecutor?.executeOnClear()

      await this.applyMiddlewares({
        type: 'clear',
      })

      await this.doClear()

      // Уведомляем глобальных подписчиков
      if (this.subscribers.has(BaseStorage.GLOBAL_SUBSCRIPTION_KEY)) {
        this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
          type: 'clear',
        })
      }

      await this.emitEvent({
        type: StorageEvents.STORAGE_CLEAR,
      })

      this.logger?.debug('Storage cleared successfully')
    } catch (error) {
      this.logger?.error('Error clearing storage', { error })
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
      this.logger?.error('Error checking value existence', { key, error })
      throw error
    }
  }

  public async getState(): Promise<Record<string, any>> {
    const keys = await this.keys()
    const state: Record<string, any> = {}

    await Promise.all(
      keys.map(async (key) => {
        state[key] = await this.get(key)
      }),
    )

    return state
  }

  // Вспомогательный метод для подписки на все изменения
  public subscribeToAll(
    callback: (event: {
      type: 'set' | 'delete' | 'clear',
      key?: string,
      value?: any
    }) => void,
  ): VoidFunction {
    return this.subscribe(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, callback)
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

  public async destroy(): Promise<void> {
    try {
      await this.clear()
      await this.doDestroy()

      await this.emitEvent({
        type: StorageEvents.STORAGE_DESTROY,
      })
    } catch (error) {
      this.logger?.error('Error destroying storage', { error })
      throw error
    }
  }

  protected getDefaultMiddleware(options?: DefaultMiddlewareOptions): Middleware[] {
    const middlewares: Middleware[] = []

    if (options?.shallowCompare !== false) {
      const equalityOptions = options?.shallowCompare || {}
      middlewares.push(createShallowCompareMiddleware(equalityOptions))
    }

    if (options?.batching !== false) {
      const batchingOptions = options?.batching || {}
      middlewares.push(createBatchingMiddleware(batchingOptions))
    }

    return middlewares
  }

  private isEqual(a: any, b: any): boolean {
    // Простое сравнение для примера
    // В реальном приложении здесь должна быть более сложная логика сравнения
    return JSON.stringify(a) === JSON.stringify(b)
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
    const segment = context.key?.split('.')[0]
    return this.middlewareChain.execute({
      ...context,
      segment,
      baseOperation: this.createBaseOperation(),
    })
  }

  protected notifySubscribers(key: string, value: any): void {
    console.log('key', key)
    console.log('value', value)
    console.log('this.subscribers.has(key)', this.subscribers.has(key))
    const hasSubscribers = this.subscribers.has(key)
    if (hasSubscribers) {
      const subscribers = this.subscribers.get(key)

      // Оборачиваем в Promise.all для асинхронных подписчиков
      Promise.all(
        // @ts-ignore
        Array.from(subscribers).map(async (callback) => {
          try {
            await callback(value)
          } catch (error) {
            this.logger?.error('Error in subscriber callback', { key, error })
          }
        }),
      ).catch((error) => {
        this.logger?.error('Error notifying subscribers', { key, error })
      })
    }
  }

  protected async emitEvent(event: StorageEvent): Promise<void> {
    try {
      await this.eventEmitter?.emit({
        ...event,
        metadata: {
          ...(event.metadata || {}),
          timestamp: Date.now(),
        },
      })
    } catch (error) {
      this.logger?.error('Error emitting event', { event, error })
    }
  }
}

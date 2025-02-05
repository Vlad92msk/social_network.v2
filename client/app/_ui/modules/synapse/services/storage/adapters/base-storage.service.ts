import { createBatchingMiddleware, createShallowCompareMiddleware } from '../middlewares'
import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import {
  DefaultMiddlewareOptions,
  IEventEmitter,
  ILogger,
  IStorage,
  Middleware, StorageChangeEvent,
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
    // Инициализация MiddlewareChain с привязанным getDefaultMiddleware
    this.middlewareChain = new MiddlewareChain(
      (options) => this.getDefaultMiddleware(options),
      config,
    )
  }

  protected async initializeWithMiddlewares(): Promise<void> {
    try {
      // Инициализируем middleware chain
      this.middlewareChain.initialize()

      // Получаем текущее состояние
      const state = await this.getState()
      const hasExistingState = Object.keys(state).length > 0

      if (hasExistingState) {
        await this.applyMiddlewares({
          type: 'init',
          value: state,
          storage: this,
        })
      } else if (this.config.initialState) {
        await this.applyMiddlewares({
          type: 'init',
          value: this.config.initialState,
          storage: this,
        })
      }
    } catch (error) {
      this.logger?.error('Error initializing storage', { error })
      throw error
    }
  }

  public abstract initialize(): Promise<this>;

  protected abstract handleExternalSet(key: string, value: any): Promise<void>;

  protected abstract handleExternalDelete(key: string): Promise<void>;

  protected abstract handleExternalClear(): Promise<void>;

  // Публичный метод, который вызывается извне (например в middleware)
  public async handleExternalChange(event: StorageChangeEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'set':
          if (event.key) {
            // Обновляем данные (только для memory так как в остальных хранилищах пустые реализации) и уведомляем подписчиков
            await this.handleExternalSet(event.key, event.value)
            // Уведомляем подписчиков конкретного ключа
            this.notifySubscribers(event.key, event.value)
            // Уведомляем глобальных подписчиков
            this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
              type: 'set',
              key: event.key,
              value: event.value,
              source: event.source,
            })
          }
          break
        case 'delete':
          if (event.key) {
            await this.handleExternalDelete(event.key)
            this.notifySubscribers(event.key, undefined)
            // Уведомляем глобальных подписчиков
            this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
              type: 'set',
              key: event.key,
              value: event.value,
              source: event.source,
            })
          }
          break
        case 'clear':
          await this.handleExternalClear()
          this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
            type: 'clear',
            source: event.source,
            timestamp: event.timestamp,
          })
          break
      }

      await this.emitEvent({
        type: `${StorageEvents.STORAGE_UPDATE}:external`,
        payload: event,
      })
    } catch (error) {
      this.logger?.error('Error handling external change', { event, error })
    }
  }

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

      // Добавим логирование
      console.log('Before middleware:', { key: processedKey });

      const value = await this.applyMiddlewares({
        type: 'get',
        key: processedKey,
      }) as T | undefined

      console.log('After middleware:', { value });

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

      // Применяем middleware перед установкой значения
      const middlewareResult = await this.applyMiddlewares({
        type: 'set',
        key,
        value: processedValue,
      })

      // Сохраняем результат после middleware
      await this.doSet(key, middlewareResult)

      // Получаем актуальное значение
      const newValue = await this.doGet(key)

      this.pluginExecutor?.executeAfterSet(key, newValue)

      // Уведомляем подписчиков
      this.notifySubscribers(key, newValue)

      if (this.subscribers.has(BaseStorage.GLOBAL_SUBSCRIPTION_KEY)) {
        this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
          type: 'set',
          key,
          value: newValue,
        })
      }

      await this.emitEvent({
        type: StorageEvents.STORAGE_UPDATE,
        payload: { key, value: newValue },
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

      // Получаем все ключи из обоих состояний
      const allKeys = new Set([
        ...Object.keys(currentState),
        ...Object.keys(newState)
      ])

      // Для каждого ключа проверяем изменения
      for (const key of allKeys) {
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
    const value = await this.doGet('')  // Используем пустой путь для получения корневого состояния
    return value || {}
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

  public subscribe(key: string, callback: (value: any) => void): VoidFunction {
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

    // Теперь поддерживаем как булевые значения, так и объекты с настройками
    // if (options?.shallowCompare !== false) {
    //   const equalityOptions = typeof options?.shallowCompare === 'object'
    //     ? options.shallowCompare
    //     : {}
    //   middlewares.push(createShallowCompareMiddleware(equalityOptions))
    // }

    // if (options?.batching !== false) {
    //   const batchingOptions = typeof options?.batching === 'object'
    //     ? options.batching
    //     : {}
    //   middlewares.push(createBatchingMiddleware(batchingOptions))
    // }

    return middlewares
  }

  private isEqual(a: any, b: any): boolean {
    // Простое сравнение для примера
    // В реальном приложении здесь должна быть более сложная логика сравнения
    return JSON.stringify(a) === JSON.stringify(b)
  }

  private createBaseOperation() {
    return async (ctx: StorageContext): Promise<any> => {
      const { type, key, value } = ctx

      try {
        switch (type) {
          case 'init':
            // При инициализации устанавливаем начальное состояние
            if (value) {
              await this.doSet('', value)  // Используем пустой путь для корневого состояния
            }
            return value
          case 'get':
            return await this.doGet(key!)
          case 'set':
            await this.doSet(key!, value)
            return value
          case 'delete':
            return await this.doDelete(key!)
          case 'clear':
            await this.doClear()
            return
          case 'keys':
            return await this.doKeys()
          default:
            throw new Error(`Unknown operation: ${type}`)
        }
      } catch (error) {
        this.logger?.error(`Error in base operation: ${type}`, { key, error })
        throw error
      }
    }
  }

  protected initializeMiddlewares(): void {
    if (this.config.middlewares) {
      const middlewares = this.config.middlewares(
        (options) => this.getDefaultMiddleware(options)
      )
      middlewares.forEach(middleware => this.use(middleware))
    }
  }

  protected async applyMiddlewares(context: StorageContext): Promise<any> {
    return this.middlewareChain.execute({
      ...context,
      baseOperation: this.createBaseOperation(),
      metadata: {
        ...context.metadata,
        timestamp: Date.now(),
      },
    })
  }

  // Метод для управления middleware (для редких случаев в основном в калссах-наследниках)
  protected use(middleware: Middleware): void {
    this.middlewareChain.use(middleware)
  }

  // Метод для обновления опций middleware
  public updateMiddlewareOptions(
    middleware: Middleware,
    options: Partial<DefaultMiddlewareOptions>,
  ): void {
    this.middlewareChain.updateMiddlewareOptions(middleware, options)
  }

  protected notifySubscribers(key: string, value: any): void {
    const subscribers = this.subscribers.get(key)
    if (!subscribers?.size) return

    Promise.all(
      Array.from(subscribers).map(async (callback) => {
        try {
          await callback(value)
        } catch (error) {
          this.logger?.error('Error in subscriber callback', {
            key,
            error,
            subscriber: callback.name || 'anonymous',
          })
        }
      }),
    ).catch((error) => {
      this.logger?.error('Error notifying subscribers', { key, error })
    })
  }

  protected async emitEvent(event: StorageEvent): Promise<void> {
    try {
      await this.eventEmitter?.emit({
        ...event,
        metadata: {
          ...(event.metadata || {}),
          timestamp: Date.now(),
          storageName: this.name,
        },
      })
    } catch (error) {
      this.logger?.error('Error emitting event', { event, error })
    }
  }
}

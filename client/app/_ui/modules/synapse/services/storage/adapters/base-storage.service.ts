import { createBatchingMiddleware, createShallowCompareMiddleware } from '../middlewares'
import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import {
  DefaultMiddlewares,
  IEventEmitter,
  ILogger,
  IStorage,
  StorageConfig,
  StorageEvent,
  StorageEvents,
} from '../storage.interface'
import { MiddlewareModule } from '../utils/middleware-module'

export abstract class BaseStorage implements IStorage {
  // Константа для глобальной подписки
  protected static readonly GLOBAL_SUBSCRIPTION_KEY = '*'

  name: string

  private middlewareModule: MiddlewareModule

  protected subscribers = new Map<string, Set<(value: any) => void>>()

  constructor(
    protected readonly config: StorageConfig,
    protected readonly pluginExecutor?: IPluginExecutor,
    protected readonly eventEmitter?: IEventEmitter,
    protected readonly logger?: ILogger,
  ) {
    this.name = config.name
    this.middlewareModule = new MiddlewareModule({
      // Предоставляем базовые операции хранилища
      doGet: this.doGet.bind(this),
      doSet: this.doSet.bind(this),
      doDelete: this.doDelete.bind(this),
      doClear: this.doClear.bind(this),
      doKeys: this.doKeys.bind(this),
      // Предоставляем методы для работы с подписчиками
      notifySubscribers: this.notifySubscribers.bind(this),
      // Предоставляем плагины и эмиттер
      pluginExecutor: this.pluginExecutor,
      eventEmitter: this.eventEmitter,
      logger: this.logger,
    })

    this.initializeMiddlewares()
  }

  protected async initializeWithMiddlewares(): Promise<void> {
    try {
      const state = await this.getState();
      const hasExistingState = Object.keys(state).length > 0;

      if (!hasExistingState && this.config.initialState) {
        // Только если нет существующих данных и есть initialState,
        // делаем dispatch для установки начального состояния
        await this.middlewareModule.dispatch({
          type: 'init',
          value: this.config.initialState,
        });
      }
    } catch (error) {
      this.logger?.error('Error initializing storage', { error });
      throw error;
    }
  }

  public abstract initialize(): Promise<this>;

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

      const value = await this.middlewareModule.dispatch({
        type: 'get',
        key: processedKey,
      })

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

      await this.middlewareModule.dispatch({
        type: 'set',
        key,
        value: processedValue,
      })

      this.pluginExecutor?.executeAfterSet(key, value)

      await this.emitEvent({
        type: StorageEvents.STORAGE_UPDATE,
        payload: { key, value },
      })
    } catch (error) {
      this.logger?.error('Error setting value', { key, error })
      throw error
    }
  }

  private isEqual(a: any, b: any): boolean {
    // Простое сравнение для примера
    // В реальном приложении здесь должна быть более сложная логика сравнения
    return JSON.stringify(a) === JSON.stringify(b)
  }

  public async update(updater: (state: any) => void): Promise<void> {
    try {
      const currentState = await this.getState()
      const newState = { ...currentState }
      updater(newState)

      // Находим изменившиеся ключи
      const changedKeys = Object.keys(newState).filter((key) => !this.isEqual(currentState[key], newState[key]))

      // Отправляем серию set-операций для изменившихся ключей
      await Promise.all(
        changedKeys.map((key) => this.middlewareModule.dispatch({
          type: 'set',
          key,
          value: newState[key],
          metadata: {
            isPartOfUpdate: true,
            previousValue: currentState[key],
          },
        })),
      )

      // Отправляем общее уведомление об обновлении
      await this.middlewareModule.dispatch({
        type: 'update',
        value: newState,
        metadata: {
          previousState: currentState,
          changedKeys,
        },
      })
    } catch (error) {
      this.logger?.error('Error updating state', { error })
      throw error
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      if (this.pluginExecutor?.executeBeforeDelete(key)) {
        await this.middlewareModule.dispatch({
          type: 'delete',
          key,
        })

        this.pluginExecutor?.executeAfterDelete(key)
      }
    } catch (error) {
      this.logger?.error('Error deleting value', { key, error })
      throw error
    }
  }

  public async clear(): Promise<void> {
    try {
      this.pluginExecutor?.executeOnClear()

      await this.middlewareModule.dispatch({
        type: 'clear',
      })
    } catch (error) {
      this.logger?.error('Error clearing storage', { error })
      throw error
    }
  }

  public async keys(): Promise<string[]> {
    try {
      return this.middlewareModule.dispatch({
        type: 'keys',
      })
    } catch (error) {
      this.logger?.error('Error getting keys', { error })
      throw error
    }
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
    const value = await this.doGet('') // Используем пустой путь для получения корневого состояния
    return value || {}
  }

  // Вспомогательный метод для подписки на все изменения
  public subscribeToAll(
    callback: (event: { type: 'set' | 'delete' | 'clear'; key?: string; value?: any }) => void,
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

  protected getDefaultMiddleware(): DefaultMiddlewares {
    return {
      batching: (options = {}) => createBatchingMiddleware(options),
      shallowCompare: (options = {}) => createShallowCompareMiddleware(options),
    }
  }

  protected initializeMiddlewares(): void {
    if (this.config.middlewares) {
      const middlewares = this.config.middlewares(
        () => this.getDefaultMiddleware(),
      )
      middlewares.forEach((middleware) => this.middlewareModule.use(middleware))
    }
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

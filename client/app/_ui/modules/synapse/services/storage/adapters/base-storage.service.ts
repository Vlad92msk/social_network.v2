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
import { Middleware, MiddlewareModule } from '../utils/middleware-module'

type PathSelector<T, R> = (state: T) => R

export abstract class BaseStorage <T extends Record<string, any>> implements IStorage<T> {
  // Константа для глобальной подписки
  protected static readonly GLOBAL_SUBSCRIPTION_KEY = '*'

  name: string

  private middlewareModule: MiddlewareModule

  private initializedMiddlewares: Middleware[] | null = null // Сохраняем созданные middleware

  protected subscribers = new Map<string, Set<(value: any) => void>>()

  constructor(
    protected readonly config: StorageConfig,
    protected readonly pluginExecutor?: IPluginExecutor,
    protected readonly eventEmitter?: IEventEmitter,
    protected readonly logger?: ILogger,
  ) {
    this.name = config.name
    this.middlewareModule = new MiddlewareModule({
      getState: this.getState.bind(this),
      // Предоставляем базовые операции хранилища
      doGet: this.doGet.bind(this),
      doSet: this.doSet.bind(this),
      doUpdate: this.doUpdate.bind(this),
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

  protected initializeMiddlewares(): void {
    if (this.config.middlewares && !this.initializedMiddlewares) {
      // Создаем middleware только один раз
      this.initializedMiddlewares = this.config.middlewares(
        () => this.getDefaultMiddleware(),
      )

      // Применяем их
      this.initializedMiddlewares.forEach((middleware) => this.middlewareModule.use(middleware))
    }
  }

  protected getDefaultMiddleware(): DefaultMiddlewares {
    return {
      batching: (options = {}) => createBatchingMiddleware(options),
      shallowCompare: (options = {}) => createShallowCompareMiddleware(options),
    }
  }

  protected async initializeWithMiddlewares(): Promise<void> {
    try {
      const state = await this.getState()
      const hasExistingState = Object.keys(state).length > 0

      if (!hasExistingState && this.config.initialState) {
        // Только если нет существующих данных и есть initialState,
        // делаем dispatch для установки начального состояния
        await this.middlewareModule.dispatch({
          type: 'init',
          value: this.config.initialState,
        })
      }
    } catch (error) {
      this.logger?.error('Error initializing storage', { error })
      throw error
    }
  }

  public abstract initialize(): Promise<this>;

  protected abstract doGet(key: string): Promise<any>;

  protected abstract doSet(key: string, value: any): Promise<void>;

  protected abstract doUpdate(updates: Array<{ key: string; value: any }>): Promise<void>;

  protected abstract doDelete(key: string): Promise<boolean>;

  protected abstract doClear(): Promise<void>;

  protected abstract doKeys(): Promise<string[]>;

  protected abstract doHas(key: string): Promise<boolean>;

  protected abstract doDestroy(): Promise<void>;

  public async get<R>(key: string): Promise<R | undefined> {
    try {
      const processedKey = this.pluginExecutor?.executeBeforeGet(key) ?? key

      const middlewareResult = await this.middlewareModule.dispatch({
        type: 'get',
        key: processedKey,
      })

      const finalResult = this.pluginExecutor?.executeAfterGet(processedKey, middlewareResult) ?? middlewareResult

      await this.emitEvent({
        type: StorageEvents.STORAGE_SELECT,
        payload: { key: processedKey, value: finalResult },
      })

      return finalResult
    } catch (error) {
      this.logger?.error('Error getting value', { key, error })
      throw error
    }
  }

  public async set<R>(key: string, value: R): Promise<void> {
    try {
      // 1. Пре-обработка через плагин
      const processedValue = this.pluginExecutor?.executeBeforeSet(key, value) ?? value

      // 2. Обработка через middleware chain
      const middlewareResult = await this.middlewareModule.dispatch({
        type: 'set',
        key,
        value: processedValue,
      })

      // 3. Пост-обработка через плагин
      const finalResult = this.pluginExecutor?.executeAfterSet(key, middlewareResult) ?? middlewareResult

      // 4. Уведомление подписчиков с финальным результатом
      this.notifySubscribers(key, finalResult)

      // 5. Уведомление глобальных подписчиков
      this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
        type: StorageEvents.STORAGE_UPDATE,
        key,
        value: finalResult,
      })

      // 6. Отправка события
      await this.emitEvent({
        type: StorageEvents.STORAGE_UPDATE,
        payload: { key, value: finalResult },
      })
    } catch (error) {
      this.logger?.error('Error setting value', { key, error })
      throw error
    }
  }

  public async update(updater: (state: T) => void): Promise<void> {
    console.log('update update')
    try {
      // 1. Получаем текущее состояние
      const currentState = await this.getState() as T
      const newState = { ...currentState } as T

      // 2. Применяем обновление
      updater(newState)

      const changedKeys = Object.keys(newState).filter(
        (key) => !this.isEqual(currentState[key], newState[key]),
      )

      if (changedKeys.length === 0) return

      const updates = changedKeys.map((key) => ({
        key,
        value: this.pluginExecutor?.executeBeforeSet(key, newState[key]) ?? newState[key],
      }))

      // 3. Делаем только один dispatch, который сам выполнит doUpdate
      const result = await this.middlewareModule.dispatch({
        type: 'update',
        value: updates,
        metadata: {
          batchUpdate: true,
          timestamp: Date.now(),
        },
      })

      // 4. После получения результата, уведомляем подписчиков
      this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
        type: StorageEvents.STORAGE_UPDATE,
        value: result,
      })

      // 5. Отправляем событие
      await this.emitEvent({
        type: StorageEvents.STORAGE_UPDATE,
        payload: { state: result },
      })
    } catch (error) {
      this.logger?.error('Error updating state', { error })
      throw error
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      if (this.pluginExecutor?.executeBeforeDelete(key)) {
        const middlewareResult = await this.middlewareModule.dispatch({
          type: 'delete',
          key,
        })

        // @ts-ignore
        const finalResult = this.pluginExecutor?.executeAfterDelete(key) ?? middlewareResult

        // Уведомляем подписчиков конкретного ключа
        this.notifySubscribers(key, undefined)

        // Уведомляем глобальных подписчиков
        this.notifySubscribers(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, {
          type: StorageEvents.STORAGE_UPDATE,
          key,
          value: undefined,
          result: finalResult, // добавляем результат операции
        })

        await this.emitEvent({
          type: StorageEvents.STORAGE_UPDATE,
          payload: { key, value: undefined, result: finalResult },
        })
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
    console.log('вызван getState')
    const value = await this.doGet('') // Используем пустой путь для получения корневого состояния
    console.log('getState', value)
    return value || {}
  }

  // Вспомогательный метод для подписки на все изменения
  public subscribeToAll(
    callback: (event: { type: 'set' | 'delete' | 'clear'; key?: string; value?: any }) => void,
  ): VoidFunction {
    console.log('dewdwedwedwed______', callback)
    return this.subscribe(BaseStorage.GLOBAL_SUBSCRIPTION_KEY, callback)
  }

  // Перегрузки метода subscribe
  public subscribe(key: string, callback: (value: any) => void): () => void;

  public subscribe<R>(pathSelector: PathSelector<T, R>, callback: (value: R) => void): () => void;

  public subscribe<R>(
    keyOrSelector: string | PathSelector<T, R>,
    callback: (value: any) => void,
  ): () => void {
    console.log('DEBUG: BaseStorage.subscribe')

    if (typeof keyOrSelector === 'string') {
      // Существующая логика для строкового ключа
      return this.subscribeByKey(keyOrSelector, callback)
    }
    // Новая логика для селектора пути
    return this.subscribeBySelector(keyOrSelector, callback)
  }

  private subscribeByKey(key: string, callback: (value: any) => void): () => void {
    console.log('DEBUG: subscribeByKey:', key)

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

  private subscribeBySelector<R>(
    pathSelector: PathSelector<T, R>,
    callback: (value: R) => void,
  ): () => void {
    console.log('DEBUG: subscribeBySelector')

    // Получаем путь из селектора
    const dummyState = this.createDummyState()
    const path = this.extractPath(pathSelector, dummyState)

    console.log('DEBUG: Extracted path:', path)

    // Используем полученный путь для подписки
    return this.subscribeByKey(path, callback)
  }

  // Вспомогательные методы
  private createDummyState(): T {
    const handler = {
      get: (target: any, prop: string) => {
        target[prop] = target[prop] || new Proxy({}, handler)
        return target[prop]
      },
    }
    return new Proxy({} as T, handler)
  }

  private extractPath(selector: (state: T) => any, dummyState: T): string {
    const paths: string[] = []
    const handler = {
      get: (target: any, prop: string) => {
        paths.push(prop)
        return target[prop]
      },
    }

    const proxiedState = new Proxy(dummyState, handler)
    selector(proxiedState)
    return paths.join('.')
  }

  protected notifySubscribers(key: string, value: any): void {
    console.log('DEBUG: BaseStorage.notifySubscribers:', { key, value })

    const subscribers = this.subscribers.get(key)
    if (!subscribers?.size) return

    subscribers.forEach((callback) => {
      try {
        callback(value)
      } catch (error) {
        console.error('Error in subscriber callback:', error)
        this.logger?.error('Error in subscriber callback', { key, error })
      }
    })
  }

  private isEqual(a: any, b: any): boolean {
    // Простое сравнение для примера
    // В реальном приложении здесь должна быть более сложная логика сравнения
    return JSON.stringify(a) === JSON.stringify(b)
  }

  public async destroy(): Promise<void> {
    try {
      await this.clear()
      await this.doDestroy()

      // Очищаем middleware и соединения
      if (this.initializedMiddlewares) {
        // Если у middleware есть метод cleanup/destroy - вызываем его
        await Promise.all(
          this.initializedMiddlewares.map(async (middleware) => {
            if ('cleanup' in middleware) {
              await middleware.cleanup?.()
            }
          })
        )
        this.initializedMiddlewares = null
      }

      await this.emitEvent({
        type: StorageEvents.STORAGE_DESTROY,
      })
    } catch (error) {
      this.logger?.error('Error destroying storage', { error })
      throw error
    }
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

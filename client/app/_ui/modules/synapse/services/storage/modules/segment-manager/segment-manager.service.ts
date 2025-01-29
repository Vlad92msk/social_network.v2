import { MiddlewareArray, MiddlewareFunction } from '../../../core/core.interface'
import type { CreateSegmentConfig, IStorage, IStorageSegment, ResultFunction, Selector, SelectorAPI, SelectorOptions, StorageFactory, } from '../../storage.interface'
import { SelectorManager, SelectorSubscription } from '../operations-manager/selector-manager.service'
import { GlobalPluginManager } from '../plugin-manager/global-plugin-manager.service'
import { SegmentPluginManager } from '../plugin-manager/segment-plugin-manager.service'

export class StorageSegment<T extends Record<string, any>> implements IStorageSegment<T> {
  private subscriptions = new Set<(state: T) => void>()

  private selectorSubscriptions = new Map<string, SelectorSubscription<any>>()

  constructor(
    private name: string,
    private selectorManager: SelectorManager,
    private storage: IStorage,
    private pluginManager: SegmentPluginManager,

  ) {
    this.storage.subscribe(this.name, async () => {
      await this.notifySubscribers()
      for (const subscription of this.selectorSubscriptions.values()) {
        await subscription.notify()
      }
    })
  }

  async select<R>(selector: (state: T) => R): Promise<R> {
    const state = await this.storage.get<T>(this.name)
    // Применяем плагины
    const processedKey = this.pluginManager.executeBeforeGet(this.name)
    const value = state as T
    const processedValue = this.pluginManager.executeAfterGet(processedKey, value)
    return selector(processedValue as T)
  }

  async update(updater: (state: T) => void): Promise<void> {
    const oldState = await this.storage.get<T>(this.name) || {} as T
    const newState = { ...oldState }
    updater(newState)
    // Применяем плагины
    const processedValue = this.pluginManager.executeBeforeSet(this.name, newState)
    await this.storage.set(this.name, processedValue)
    this.pluginManager.executeAfterSet(this.name, processedValue)
  }

  async getByPath<R>(path: string): Promise<R | undefined> {
    return this.storage.get<R>(path)
  }

  async setByPath<R>(path: string, value: R): Promise<void> {
    await this.storage.set(path, value)
  }

  async patch(value: Partial<T>): Promise<void> {
    const oldState = await this.storage.get<T>(this.name) || {} as T
    const newState = { ...oldState, ...value }
    // Применяем плагины
    const processedValue = this.pluginManager.executeBeforeSet(this.name, newState)
    await this.storage.set(this.name, processedValue)
    this.pluginManager.executeAfterSet(this.name, processedValue)
  }

  subscribe(listener: (state: T) => void): () => void {
    this.subscriptions.add(listener)
    return () => this.subscriptions.delete(listener)
  }

  async clear(): Promise<void> {
    // Применяем плагины
    if (this.pluginManager.executeBeforeDelete(this.name)) {
      await this.storage.clear()
      this.pluginManager.executeAfterDelete(this.name)
      this.pluginManager.executeOnClear()
    }
  }

  createSelector<R>(
    selector: Selector<T, R>,
    options?: SelectorOptions<R>
  ): SelectorAPI<R>;

  createSelector<Deps extends any[], R>(
    dependencies: Array<Selector<T, Deps[number]> | SelectorAPI<Deps[number]>>,
    resultFn: ResultFunction<Deps, R>,
    options?: SelectorOptions<R>
  ): SelectorAPI<R>;

  createSelector<R>(
    selectorOrDeps: Selector<T, R> | Array<Selector<T, any> | SelectorAPI<any>>,
    resultFnOrOptions?: ResultFunction<any[], R> | SelectorOptions<R>,
    options?: SelectorOptions<R>,
  ): SelectorAPI<R> {
    const id = `selector_${Date.now()}_${Math.random().toString(36).slice(2)}`

    if (Array.isArray(selectorOrDeps)) {
      const api = this.selectorManager.createSelector(
        selectorOrDeps as Array<SelectorAPI<any>>,
        resultFnOrOptions as ResultFunction<any[], R>,
        options,
      )
      // Сохраняем подписку
      const subscription = new SelectorSubscription(
        api.select,
        options?.equals || ((a, b) => a === b),
      )
      this.selectorSubscriptions.set(id, subscription)
      return api
    }

    const subscription = new SelectorSubscription(
      async () => {
        const state = await this.storage.get<T>(this.name)
        return (selectorOrDeps as Selector<T, R>)(state as T)
      },
      (resultFnOrOptions as SelectorOptions<R>)?.equals || ((a, b) => a === b),
    )

    this.selectorSubscriptions.set(id, subscription)

    return {
      select: subscription.selector,
      subscribe: (listener) => {
        const unsubscribe = subscription.subscribe(listener)
        return () => {
          unsubscribe()
          this.selectorSubscriptions.delete(id)
        }
      },
    }
  }

  private async notifySubscribers(): Promise<void> {
    const state = await this.storage.get<T>(this.name)
    this.subscriptions.forEach((listener) => listener(state as T))
  }
}

export class StorageSegmentManager {
  readonly name = 'segmentManager'

  private segments = new Map<string, StorageSegment<any>>()

  private storages = new Map<string, IStorage>()

  private segmentPluginManagers = new Map<string, SegmentPluginManager>()

  constructor(
    private selectorManager: SelectorManager,
    private createStorageInstance: StorageFactory,
    private globalPluginManager: GlobalPluginManager,
  ) {}

  async createSegment<T extends Record<string, any>>(config: CreateSegmentConfig<T>): Promise<StorageSegment<T>> {
    if (this.segments.has(config.name)) {
      throw new Error(`Segment ${config.name} already exists`)
    }

    // Создаем SegmentPluginManager
    const segmentPluginManager = new SegmentPluginManager(
      config.name,
      this.globalPluginManager,
    )

    // Инициализируем плагины сегмента если они есть
    if (config.plugins) {
      await Promise.all(config.plugins.map((plugin) => segmentPluginManager.add(plugin)))
    }

    // Сохраняем менеджер плагинов сегмента
    this.segmentPluginManagers.set(config.name, segmentPluginManager)

    // Создаем опции для фабрики хранилища с правильной типизацией
    const storage = await this.createStorageInstance({
      type: config.type,
      options: config.options,
      plugins: config.plugins,
      middlewares: config.isRoot
        ? (config.middlewares as MiddlewareFunction)
        : (config.middlewares as MiddlewareArray),
      isRoot: config.isRoot,
    })

    this.storages.set(config.name, storage)

    // Устанавливаем начальное состояние
    if (config.initialState) {
      await storage.set(config.name, config.initialState)
    }

    // Создаем сегмент
    const segment = new StorageSegment<T>(
      config.name,
      this.selectorManager,
      storage,
      segmentPluginManager,
    )

    this.segments.set(config.name, segment)
    return segment
  }

  async destroy(): Promise<void> {
    // Очищаем все сегменты и их плагин менеджеры
    for (const [name, segment] of this.segments) {
      await segment.clear()
      const pluginManager = this.segmentPluginManagers.get(name)
      if (pluginManager) {
        await pluginManager.destroy()
      }
    }

    this.segments.clear()
    this.storages.clear()
    this.segmentPluginManagers.clear()
  }
}

import { Inject, Injectable } from '../../../../decorators'
import { BaseModule } from '../../../core/base.service'
import type { IDIContainer } from '../../../di-container/di-container.interface'
import {
  type IndexDBConfig, IStorage, IStorageConfig, IStorageSegment, ResultFunction, SegmentConfig, Selector, SelectorAPI, SelectorOptions,
} from '../../storage.interface'
import { SelectorManager, SelectorSubscription } from '../operations-manager/selector-manager.service'

export class StorageSegment<T extends Record<string, any>> implements IStorageSegment<T> {
  private subscriptions = new Set<(state: T) => void>()

  private selectorSubscriptions = new Map<string, SelectorSubscription<any>>()

  constructor(
    private name: string,
    private selectorManager: SelectorManager,
    private storage: IStorage,
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
    return selector(state as T)
  }

  async update(updater: (state: T) => void): Promise<void> {
    const currentState = await this.storage.get<T>(this.name) || {} as T
    const newState = { ...currentState }
    updater(newState)
    await this.storage.set(this.name, newState)
  }

  async getByPath<R>(path: string): Promise<R | undefined> {
    return this.storage.get<R>(path)
  }

  async setByPath<R>(path: string, value: R): Promise<void> {
    await this.storage.set(path, value)
  }

  async patch(value: Partial<T>): Promise<void> {
    const currentState = await this.storage.get<T>(this.name) || {} as T
    const newState = { ...currentState, ...value }
    await this.storage.set(this.name, newState)
  }

  subscribe(listener: (state: T) => void): () => void {
    this.subscriptions.add(listener)
    return () => this.subscriptions.delete(listener)
  }

  async clear(): Promise<void> {
    await this.storage.clear()
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

@Injectable()
export class StorageSegmentManager extends BaseModule {
  readonly name = 'segmentManager'

  private segments = new Map<string, StorageSegment<any>>()

  private storages = new Map<string, IStorage>()

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('selectorManager') private selectorManager: SelectorManager,
    @Inject('createStorage') private createStorageInstance: (type: IStorageConfig['type'], options?: IndexDBConfig) => Promise<IStorage>,
  ) {
    super(container)
  }

  async createSegment<T extends Record<string, any>>(config: SegmentConfig<T>): Promise<StorageSegment<T>> {
    if (this.segments.has(config.name)) {
      throw new Error(`Segment ${config.name} already exists`)
    }

    const storage = await this.createStorageInstance(config.type, config.options)
    this.storages.set(config.name, storage)

    if (config.initialState) {
      await storage.set(config.name, config.initialState)
    }

    const segment = new StorageSegment<T>(
      config.name,
      this.selectorManager,
      storage,
    )

    this.segments.set(config.name, segment)
    return segment
  }

  protected async registerServices(): Promise<void> {}

  protected async setupEventHandlers(): Promise<void> {}

  protected async cleanupResources(): Promise<void> {
    await Promise.all(Array.from(this.segments.values()).map((s) => s.clear()))
    this.segments.clear()
    this.storages.clear()
  }
}

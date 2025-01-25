import { Inject, Injectable } from '../../../../decorators'
import { BaseModule } from '../../../core/base.service'
import type { IDIContainer } from '../../../di-container/di-container.interface'
import { type IndexDBConfig, IStorage, IStorageConfig, SegmentConfig, SelectorAPI, SelectorOptions } from '../../storage.interface'
import { SelectorSubscription, StateOperationsManager } from '../operations-manager/operations-manager.service'
import { StateManager } from '../state-manager/state-manager.service'

class StorageSegment<T> {
  private subscriptions = new Map<string, SelectorSubscription<any>>()

  constructor(
    private name: string,
    private stateManager: StateManager,
    private operationsManager: StateOperationsManager,
    private storage: IStorage,
  ) {
    this.storage.subscribe(this.name, async (newState) => {
      for (const subscription of this.subscriptions.values()) {
        await subscription.notify(newState)
      }
    })
  }

  async get<R>(selector: (state: T) => R): Promise<R> {
    const state = await this.storage.get(this.name)
    // @ts-ignore
    return selector(state)
  }

  async set(value: Partial<T>): Promise<void> {
    const currentState = await this.storage.get(this.name) || {}
    const newState = {
      ...currentState,
      ...value,
    }
    await this.storage.set(this.name, newState)
  }

  async patch(value: Partial<T>): Promise<void> {
    const currentState = await this.storage.get(this.name) || {}
    const newState = {
      ...currentState,
      ...value,
    }
    await this.storage.set(this.name, newState)
  }

  async update(updater: (state: T) => void): Promise<void> {
    const currentState = await this.storage.get(this.name) || {}
    const newState = { ...currentState }

    // @ts-ignore
    updater(newState)

    await this.storage.set(this.name, newState)
  }

  createSelector<R>(selector: (state: T) => R, options?: SelectorOptions<R>): SelectorAPI<R> {
    const id = `selector_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const subscription = new SelectorSubscription(
      async () => {
        const state = await this.storage.get(this.name) || {} as T
        // @ts-ignore
        return selector(state)
      },
      options?.equals || ((a, b) => a === b),
    )

    this.subscriptions.set(id, subscription)

    return {
      select: async () => {
        const state = await this.storage.get(this.name) || {} as T
        // @ts-ignore
        return selector(state)
      },
      subscribe: (listener) => {
        const unsubscribe = subscription.subscribe(listener)
        return () => {
          unsubscribe()
          this.subscriptions.delete(id)
        }
      },
    }
  }

  async destroy(): Promise<void> {
    await this.storage.clear()
  }
}

@Injectable()
export class StorageSegmentManager extends BaseModule {
  readonly name = 'segmentManager'

  private segments = new Map<string, StorageSegment<any>>()

  private storages = new Map<string, IStorage>()

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('stateManager') private stateManager: StateManager,
    @Inject('operationsManager') private operationsManager: StateOperationsManager,
    @Inject('createStorage') private createStorageInstance: (type: IStorageConfig['type'], options?: IndexDBConfig) => Promise<IStorage>,
  ) {
    super(container)
  }

  async createSegment<T>(config: SegmentConfig<T>): Promise<StorageSegment<T>> {
    if (this.segments.has(config.name)) {
      throw new Error(`Segment ${config.name} already exists`)
    }

    // Создаем хранилище для сегмента
    const storage = await this.createStorageInstance(config.type, config.options)
    this.storages.set(config.name, storage)

    // Инициализируем состояние в хранилище сегмента
    if (config.initialState) {
      await storage.set(config.name, config.initialState)
    }

    const segment = new StorageSegment<T>(
      config.name,
      this.stateManager,
      this.operationsManager,
      storage,
    )

    this.segments.set(config.name, segment)
    return segment
  }

  protected async registerServices(): Promise<void> {}

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('app', (event) => {
      if (event.type === 'app:cleanup') this.cleanupResources()
    })
  }

  protected async cleanupResources(): Promise<void> {
    await Promise.all(Array.from(this.segments.values()).map((s) => s.destroy()))
    this.segments.clear()
    this.storages.clear()
  }
}

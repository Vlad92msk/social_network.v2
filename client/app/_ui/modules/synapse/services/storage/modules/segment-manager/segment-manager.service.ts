import { Inject, Injectable } from '../../../../decorators'
import { BaseModule } from '../../../core/base.service'
import type { IDIContainer } from '../../../di-container/di-container.interface'
import { IStorage, IStorageConfig, SegmentConfig, SelectorAPI, SelectorOptions } from '../../storage.interface'
import { StateOperationsManager } from '../operations-manager/operations-manager.service'
import { StateManager } from '../state-manager/state-manager.service'

class StorageSegment<T> {
  constructor(
    private name: string,
    private stateManager: StateManager,
    private operationsManager: StateOperationsManager,
    private storage: IStorage,
  ) {}

  async get<R>(selector: (state: T) => R): Promise<R> {
    const state = await this.stateManager.getState()
    return selector(state[this.name])
  }

  async set(value: Partial<T>): Promise<void> {
    const state = await this.stateManager.getState()
    await this.stateManager.set(this.name, {
      ...state[this.name],
      ...value,
    })
  }

  createSelector<R>(selector: (state: T) => R, options?: SelectorOptions<R>): SelectorAPI<R> {
    return this.operationsManager.createSelector(
      (state) => selector(state[this.name]),
      options,
    )
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
    @Inject('createStorage') private createStorageInstance: (type: IStorageConfig['type']) => Promise<IStorage>,
  ) {
    super(container)
  }

  async createSegment<T>(config: SegmentConfig<T>): Promise<StorageSegment<T>> {
    if (this.segments.has(config.name)) {
      throw new Error(`Segment ${config.name} already exists`)
    }

    const storage = await this.createStorageInstance(config.type)
    this.storages.set(config.name, storage)

    const segment = new StorageSegment<T>(
      config.name,
      this.stateManager,
      this.operationsManager,
      storage,
    )

    if (config.initialState) {
      await segment.set(config.initialState)
    }

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
    await Promise.all(Array.from(this.segments.values()).map(s => s.destroy()))
    this.segments.clear()
    this.storages.clear()
  }
}

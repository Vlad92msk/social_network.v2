import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import { SegmentedEventBus } from '../event-bus/event-bus.service'
import { IndexedDBStorage } from './adapters/indexed-DB.service'
import { LocalStorage } from './adapters/local-storage.service'
import { MemoryStorage } from './adapters/memory-storage.service'
import { SelectorManager } from './modules/operations-manager/selector-manager.service'
import { StorageSegmentManager } from './modules/segment-manager/segment-manager.service'
import { StoragePluginManager } from './plugin-manager.service'
import type {
  IndexDBConfig, IStorage, IStorageConfig, IStorageSegment, SegmentConfig, SelectorAPI, SelectorOptions,
} from './storage.interface'

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  private rootSegment: IStorageSegment<Record<string, any>>

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('STORAGE_CONFIG') private readonly config: IStorageConfig,
  ) {
    super(container)
    if (!config) throw new Error('StorageConfig is required')
  }

  static async create(config: IStorageConfig, parentContainer?: IDIContainer): Promise<StorageModule> {
    const container = new DIContainer({ parent: parentContainer })

    // Базовые зависимости
    container.register({ id: 'container', instance: container })
    container.register({ id: 'STORAGE_CONFIG', instance: config })

    // Регистрация менеджеров
    container.register({
      id: SelectorManager,
      type: SelectorManager,
      metadata: { dependencies: ['container'] },
    })

    container.register({
      id: StoragePluginManager,
      type: StoragePluginManager,
      metadata: {
        dependencies: ['container'],
      },
    })

    container.register({
      id: 'pluginManager',
      instance: container.resolve(StoragePluginManager)
    })

    container.register({
      id: StorageSegmentManager,
      type: StorageSegmentManager,
      metadata: {
        dependencies: ['container', 'selectorManager', 'createStorage'],
      },
    })

    // Хранилища
    container.register({
      id: MemoryStorage,
      type: MemoryStorage,
      metadata: {
        dependencies: ['STORAGE_CONFIG', 'pluginManager', 'eventBus', 'logger'],
      },
    })
    container.register({
      id: LocalStorage,
      type: LocalStorage,
      metadata: {
        dependencies: ['STORAGE_CONFIG', 'pluginManager', 'eventBus', 'logger'],
      },
    })
    container.register({
      id: IndexedDBStorage,
      type: IndexedDBStorage,
      metadata: {
        dependencies: ['STORAGE_CONFIG', 'pluginManager', 'eventBus', 'logger'],
      },
    })

    const createStorage = async (type: IStorageConfig['type'], options?: IndexDBConfig): Promise<IStorage> => {
      if (type === 'indexDB' && options) {
        const currentConfig = { ...config, type, options }
        container.remove('STORAGE_CONFIG')
        container.register({ id: 'STORAGE_CONFIG', instance: currentConfig })
      }
      switch (type) {
        case 'localStorage': return container.resolve(LocalStorage)
        case 'indexDB': return container.resolve(IndexedDBStorage)
        case 'memory':
        default: return container.resolve(MemoryStorage)
      }
    }

    container.register({ id: 'createStorage', instance: createStorage })

    // Создание и инициализация
    const storageModule = container.resolve<StorageModule>(StorageModule)
    await storageModule.initialize()

    // Создание корневого сегмента
    const segmentManager = storageModule.getChildModule<StorageSegmentManager>('segmentManager')
    storageModule.rootSegment = await segmentManager.createSegment({
      name: 'root',
      type: config.type,
      options: config.options,
      initialState: config.initialState,
    })

    return storageModule
  }

  // Public API для работы с корневым сегментом
  public async select<T>(selector: (state: any) => T): Promise<T> {
    return this.rootSegment.select(selector)
  }

  public async update(updater: (state: any) => void): Promise<void> {
    return this.rootSegment.update(updater)
  }

  public async patch(value: any): Promise<void> {
    return this.rootSegment.patch(value)
  }

  public async createSegment<T extends Record<string, any>>(config: SegmentConfig<T>): Promise<IStorageSegment<T>> {
    return this.getChildModule<StorageSegmentManager>('segmentManager').createSegment(config)
  }

  public createSelector<T>(
    selectorOrDeps: ((state: any) => T) | Array<SelectorAPI<any>>,
    resultFn?: (...values: any[]) => T,
    options?: SelectorOptions<T>,
  ): SelectorAPI<T> {
    if (Array.isArray(selectorOrDeps)) {
      return this.getChildModule<SelectorManager>('selectorManager')
        .createSelector(selectorOrDeps, resultFn!, options)
    }
    return this.rootSegment.createSelector(selectorOrDeps, options)
  }

  protected async registerServices(): Promise<void> {
    const selectorManager = this.container.resolve(SelectorManager)
    await selectorManager.initialize()
    this.registerChildModule('selectorManager', selectorManager)

    const segmentManager = this.container.resolve(StorageSegmentManager)
    await segmentManager.initialize()
    this.registerChildModule('segmentManager', segmentManager)

    if (this.config.plugins) {
      const pluginManager = this.container.resolve(StoragePluginManager)
      this.registerChildModule('pluginManager', pluginManager)
      await Promise.all(this.config.plugins.map((plugin) => pluginManager.add(plugin)))
    }
  }

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('app', async (event) => {
      if (event.type === 'app:cleanup') {
        await this.cleanupResources()
      }
    })

    const eventBus = this.container.get<SegmentedEventBus>('eventBus')
    eventBus.createSegment({
      name: 'storage',
      eventTypes: [
        'storage:value:changed',
        'storage:value:accessed',
      ],
      priority: 100,
    })
  }

  protected async cleanupResources(): Promise<void> {
    await this.rootSegment.clear()
  }
}

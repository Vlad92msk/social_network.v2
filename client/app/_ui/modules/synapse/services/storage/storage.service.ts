import { IndexedDBStorage } from './indexed-DB.service'
import { LocalStorage } from './local-storage.service'
import { MemoryStorage } from './memory-storage.service'
import { StoragePluginManager } from './plugin-manager.service'
import { StateManager } from './segment-manager.service'
import { SelectorManager } from './selector-manager.service'
import { StorageSegmentManager } from './state-manager.service'
import type {
  IStorage, IStorageConfig, IStorageSegment, SegmentConfig, Selector, SelectorAPI, SelectorOptions,
} from './storage.interface'
import { dataUtils } from './storage.utils'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import type { EventBusSegmentConfig, IEventBus } from '../event-bus/event-bus.interface'

// Создаем конфигурацию для storage сегмента
export const StorageSegmentConfig: EventBusSegmentConfig = {
  name: 'storage',
  priority: 100,
  eventTypes: [
    'storage:changed',
    'storage:value:accessed',
    'storage:value:changed',
    'storage:value:deleted',
    'storage:cleared',
    'storage:destroyed',
  ],
}

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('STORAGE_CONFIG') private readonly config: IStorageConfig,
  ) {
    super(container)
    if (!config) throw new Error('StorageConfig is required')
  }

  static create(config: IStorageConfig, parentContainer?: IDIContainer): StorageModule {
    const container = new DIContainer({ parent: parentContainer })

    // Базовая регистрация
    container.register<IDIContainer>({ id: 'container', instance: container })
    container.register<IStorageConfig>({ id: 'STORAGE_CONFIG', instance: config })

    // Регистрируем базовые хранилища
    container.register({
      id: MemoryStorage,
      type: MemoryStorage,
    })
    container.register({
      id: LocalStorage,
      type: LocalStorage,
    })
    container.register({
      id: IndexedDBStorage,
      type: IndexedDBStorage,
    })

    // Функция создания хранилища
    const createStorageInstance = async (type: IStorageConfig['type']): Promise<IStorage> => {
      switch (type) {
        case 'localStorage':
          return container.resolve(LocalStorage)
        case 'indexDB':
          return container.resolve(IndexedDBStorage)
        case 'memory':
        default:
          return container.resolve(MemoryStorage)
      }
    }

    container.register({
      id: 'createStorage',
      instance: createStorageInstance,
    })

    // Регистрируем менеджеры
    container.register({
      id: StateManager,
      type: StateManager,
      metadata: {
        dependencies: ['storage', 'eventBus'],
      },
    })

    container.register({
      id: SelectorManager,
      type: SelectorManager,
      metadata: {
        dependencies: [StateManager],
      },
    })

    container.register({
      id: StorageSegmentManager,
      type: StorageSegmentManager,
      metadata: {
        dependencies: ['storage', StateManager, SelectorManager, 'createStorage'],
      },
    })

    // Регистрируем тип менеджера плагинов
    container.register({
      id: StoragePluginManager,
      type: StoragePluginManager,
      metadata: {
        dependencies: ['container'],
      },
    })

    // Создаем экземпляр плагин-менеджера и регистрируем его как сервис
    container.register({
      id: 'pluginManager',
      instance: container.resolve(StoragePluginManager),
    })

    container.register({
      id: StorageModule,
      type: StorageModule,
      metadata: {
        dependencies: ['container', 'STORAGE_CONFIG'],
      },
    })

    return container.resolve(StorageModule)
  }

  protected async registerServices(): Promise<void> {
    // 1. Настраиваем EventBus
    const eventBus = this.container.get<IEventBus>('eventBus')
    eventBus.createSegment(StorageSegmentConfig)

    // 2. Создаем и регистрируем базовое хранилище
    const createStorage = this.container.get<(type: IStorageConfig['type']) => Promise<IStorage>>('createStorage')
    const defaultStorage = await createStorage(this.config.type)

    this.container.register({
      id: 'storage',
      instance: defaultStorage,
    })

    // 3. Инициализируем менеджеры как дочерние модули
    const stateManager = this.container.resolve(StateManager)
    this.registerChildModule('stateManager', stateManager)

    const selectorManager = this.container.resolve(SelectorManager)
    this.registerChildModule('selectorManager', selectorManager)

    const segmentManager = this.container.resolve(StorageSegmentManager)
    this.registerChildModule('segmentManager', segmentManager)

    // 4. Инициализируем плагины если есть
    if (this.config.plugins) {
      const pluginManager = this.container.resolve(StoragePluginManager)
      this.registerChildModule('pluginManager', pluginManager)

      await Promise.all(this.config.plugins.map((plugin) => pluginManager.add(plugin)))
    }

    // 5. Инициализируем начальное состояние если есть
    if (this.config.initialState) {
      await this.initializeState(this.config.initialState)
    }
  }

  // Public API methods now delegate to appropriate managers
  public async getState(): Promise<Record<string, any>> {
    const stateManager = this.getChildModule<StateManager>('stateManager')
    return stateManager.getState()
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const stateManager = this.getChildModule<StateManager>('stateManager')
    return stateManager.get(key)
  }

  public async set<T>(key: string, value: T): Promise<void> {
    const stateManager = this.getChildModule<StateManager>('stateManager')
    return stateManager.set(key, value)
  }

  public createSelector<State extends Record<string, any>, R>(
    selector: Selector<State, R>,
    options?: SelectorOptions<R>,
  ): SelectorAPI<R> {
    const selectorManager = this.getChildModule<SelectorManager>('selectorManager')
    return selectorManager.createSelector(selector, options)
  }

  public async createSegment<T extends Record<string, any>>(
    config: SegmentConfig<T>,
  ): Promise<IStorageSegment<T>> {
    const segmentManager = this.getChildModule<StorageSegmentManager>('segmentManager')
    return segmentManager.createSegment(config)
  }

  protected async setupEventHandlers(): Promise<void> {
    const eventBus = this.container.get<IEventBus>('eventBus')

    eventBus.subscribe('app', async (event) => {
      if (event.type === 'app:cleanup') {
        await this.cleanupResources()
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    // Очистка происходит автоматически через BaseModule.destroy()
    // который вызывает destroy() для всех дочерних модулей
    await super.destroy()
  }

  private async initializeState(initialState: Record<string, any>): Promise<void> {
    const stateManager = this.getChildModule<StateManager>('stateManager')
    const flatState = dataUtils.flatten(initialState)

    for (const [key, value] of Object.entries(flatState)) {
      await stateManager.set(key, value)
    }
  }
}

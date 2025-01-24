import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import { IndexedDBStorage } from './adapters/indexed-DB.service'
import { LocalStorage } from './adapters/local-storage.service'
import { MemoryStorage } from './adapters/memory-storage.service'
import { StateOperationsManager } from './modules/operations-manager/operations-manager.service'
import { StorageSegmentManager } from './modules/segment-manager/segment-manager.service'
import { StateManager } from './modules/state-manager/state-manager.service'
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig, IStorageSegment, SegmentConfig, SelectorAPI, SelectorOptions } from './storage.interface'

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

  /**
   * Фабричный метод для создания StorageModule.
   * Используется для:
   * 1. Инициализации DI-контейнера
   * 2. Регистрации всех зависимостей
   * 3. Создания и инициализации модуля
   */
  static async create(config: IStorageConfig, parentContainer?: IDIContainer): Promise<StorageModule> {
    // Создаем новый контейнер, связанный с родительским (если есть)
    const container = new DIContainer({ parent: parentContainer })

    // Регистрируем базовые зависимости
    container.register({ id: 'container', instance: container })
    container.register({ id: 'STORAGE_CONFIG', instance: config })

    // Регистрируем PluginManager до создания хранилищ
    container.register({
      id: StoragePluginManager,
      type: StoragePluginManager,
      metadata: {
        dependencies: ['container'],
      },
    })

    // Регистрируем все доступные реализации хранилищ
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

    /**
     * Фабричная функция для создания хранилища нужного типа.
     * Регистрируется как сервис, чтобы другие компоненты могли создавать
     * дополнительные экземпляры хранилищ при необходимости.
     */
    const createStorage = async (type: IStorageConfig['type']): Promise<IStorage> => {
      switch (type) {
        case 'localStorage': return container.resolve(LocalStorage)
        case 'indexDB': return container.resolve(IndexedDBStorage)
        case 'memory':
        default: return container.resolve(MemoryStorage)
      }
    }

    container.register({ id: 'createStorage', instance: createStorage })

    // Создаем и регистрируем основное хранилище
    const defaultStorage = await createStorage(config.type)
    container.register({ id: 'storage', instance: defaultStorage })

    /**
     * Регистрируем основные менеджеры.
     * Важно: metadata.dependencies указывает порядок параметров конструктора
     */
    container.register({
      id: StateManager,
      type: StateManager,
      metadata: {
        dependencies: ['container', 'storage'],
      },
    })

    container.register({
      id: StateOperationsManager,
      type: StateOperationsManager,
      metadata: {
        dependencies: ['container', 'stateManager'],
      },
    })

    container.register({
      id: StorageSegmentManager,
      type: StorageSegmentManager,
      metadata: {
        dependencies: ['container', 'stateManager', 'operationsManager', 'createStorage'],
      },
    })

    // Создаем и инициализируем модуль
    const storageModule = container.resolve<StorageModule>(StorageModule)
    await storageModule.initialize()

    if (config.initialState) {
      await storageModule.initializeState(config.initialState)
    }

    return storageModule
  }

  /**
   * Регистрация дочерних модулей.
   * Здесь мы:
   * 1. Создаем экземпляры через container.resolve (используя зависимости из metadata)
   * 2. Инициализируем их
   * 3. Регистрируем как дочерние модули для управления жизненным циклом
   */
  protected async registerServices(): Promise<void> {
    const pluginManager = this.container.resolve(StoragePluginManager)
    await pluginManager.initialize()
    this.registerChildModule('pluginManager', pluginManager)

    // Затем StateManager так как другие зависят от него
    const stateManager = this.container.resolve(StateManager)
    await stateManager.initialize()
    this.registerChildModule('stateManager', stateManager)

    const operationsManager = this.container.resolve(StateOperationsManager)
    await operationsManager.initialize()
    this.registerChildModule('operationsManager', operationsManager)

    const segmentManager = this.container.resolve(StorageSegmentManager)
    await segmentManager.initialize()
    this.registerChildModule('segmentManager', segmentManager)
  }

  public async initializeState(initialState: Record<string, any>): Promise<void> {
    const stateManager = this.getChildModule<StateManager>('stateManager')
    for (const [key, value] of Object.entries(initialState)) {
      await stateManager.set(key, value)
    }
  }

  // Public API
  // @ts-ignore
  public async createSegment<T>(config: SegmentConfig<T>): Promise<IStorageSegment<T>> {
    // @ts-ignore
    return this.getChildModule<StorageSegmentManager>('segmentManager')
      .createSegment(config)
  }

  public createSelector<T>(
    selectorOrDeps: ((state: any) => T) | Array<SelectorAPI<any>>,
    resultFn?: (...values: any[]) => T,
    options?: SelectorOptions<T>,
  ): SelectorAPI<T> {
    return this.getChildModule<StateOperationsManager>('operationsManager')
      .createSelector(selectorOrDeps, resultFn, options)
  }

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('app', async (event) => {
      if (event.type === 'app:cleanup') {
        await this.cleanupResources()
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    await super.destroy()
  }
}

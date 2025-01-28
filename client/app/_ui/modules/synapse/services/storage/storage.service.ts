import { Inject, Injectable } from '@ui/modules/synapse/decorators'
import { StorageEvents } from './storage.interface'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import { IndexedDBStorage } from './adapters/indexed-DB.service'
import { LocalStorage } from './adapters/local-storage.service'
import { MemoryStorage } from './adapters/memory-storage.service'
import { SelectorManager } from './modules/operations-manager/selector-manager.service'
import { GlobalPluginManager } from './modules/plugin-manager/global-plugin-manager.service'
import { StorageSegmentManager } from './modules/segment-manager/segment-manager.service'
import type {
  IStorage,
  IStorageConfig,
  IStorageSegment,
  RootStorageConfig,
  SegmentConfig,
  SelectorAPI,
  SelectorOptions,
  StorageFactory,
  StorageFactoryOptions,
} from './storage.interface'

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  private rootSegment: IStorageSegment<Record<string, any>>

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('STORAGE_CONFIG') private readonly config: RootStorageConfig,
    @Inject('pluginManager') private readonly pluginManager: GlobalPluginManager,
    @Inject('segmentManager') private readonly segmentManager: StorageSegmentManager,
    @Inject('selectorManager') private readonly selectorManager: SelectorManager,
  ) {
    super(container)
    if (!config) throw new Error('StorageConfig is required')
  }

  /**
   * Создает самостоятельный модуль с собственным DI контейнером
   */
  static async create(config: IStorageConfig, parentContainer?: IDIContainer): Promise<StorageModule> {
    const container = new DIContainer({ parent: parentContainer })

    // 1. Регистрируем базовую конфигурацию
    container.register({
      id: 'container',
      instance: container,
    })
    container.register({
      id: 'STORAGE_CONFIG',
      instance: config,
    })

    // 2. Создаем и регистрируем фабрику хранилищ
    const createStorage: StorageFactory = async (options: StorageFactoryOptions): Promise<IStorage> => {
      const { type } = options

      if (type === 'indexDB' && options.options) {
        const currentConfig = {
          ...config,
          type: options.type,
          options: options.options,
        }
        container.remove('STORAGE_CONFIG')
        container.register({ id: 'STORAGE_CONFIG', instance: currentConfig })
      }

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
    container.register({ id: 'createStorage', instance: createStorage })

    // 3. Регистрируем менеджеры
    const selectorManager = new SelectorManager(container)
    container.register({
      id: 'selectorManager',
      instance: selectorManager,
    })

    const globalPluginManager = new GlobalPluginManager(
      container,
      container.get('eventBus'),
    )
    container.register({
      id: 'pluginManager',
      instance: globalPluginManager,
    })

    const segmentManager = new StorageSegmentManager(
      container,
      selectorManager,
      createStorage,
      globalPluginManager,
    )
    container.register({
      id: 'segmentManager',
      instance: segmentManager,
    })

    // 4. Создаем и инициализируем модуль
    const module = container.resolve<StorageModule>(StorageModule)
    await module.initialize()

    return module
  }

  async initialize(): Promise<void> {
    await super.initialize()

    // Инициализация плагинов
    if (this.config.plugins?.length) {
      await this.pluginManager.initialize()
      await Promise.all(
        this.config.plugins.map((plugin) => this.pluginManager.add(plugin)),
      )
    }

    // Создание корневого сегмента
    this.rootSegment = await this.segmentManager.createSegment({
      name: 'root',
      type: this.config.type,
      options: this.config.options,
      initialState: this.config.initialState,
      middlewares: this.config.middlewares,
      isRoot: true,
    })
  }

  // Public API
  public async select<T>(selector: (state: any) => T): Promise<T> {
    return this.rootSegment.select(selector)
  }

  public async update(updater: (state: any) => void): Promise<void> {
    return this.rootSegment.update(updater)
  }

  public async patch(value: any): Promise<void> {
    return this.rootSegment.patch(value)
  }

  public async createSegment<T extends Record<string, any>>(
    config: SegmentConfig<T>,
  ): Promise<IStorageSegment<T>> {
    return this.segmentManager.createSegment(config)
  }

  public createSelector<T>(
    selectorOrDeps: ((state: any) => T) | Array<SelectorAPI<any>>,
    resultFn?: (...values: any[]) => T,
    options?: SelectorOptions<T>,
  ): SelectorAPI<T> {
    if (Array.isArray(selectorOrDeps)) {
      return this.selectorManager.createSelector(
        selectorOrDeps,
        resultFn!,
        options,
      )
    }
    return this.rootSegment.createSelector(selectorOrDeps, options)
  }

  protected async registerServices(): Promise<void> {
    // Регистрируем адаптеры хранилищ
    this.container.register({
      id: MemoryStorage,
      type: MemoryStorage,
      metadata: {
        dependencies: ['STORAGE_CONFIG', 'pluginManager', 'eventBus', 'logger'],
      },
    })

    this.container.register({
      id: LocalStorage,
      type: LocalStorage,
      metadata: {
        dependencies: ['STORAGE_CONFIG', 'pluginManager', 'eventBus', 'logger'],
      },
    })

    this.container.register({
      id: IndexedDBStorage,
      type: IndexedDBStorage,
      metadata: {
        dependencies: ['STORAGE_CONFIG', 'pluginManager', 'eventBus', 'logger'],
      },
    })
  }

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('app', async (event) => {
      if (event.type === 'app:cleanup') {
        await this.cleanupResources()
      }
    })

    this.eventBus.subscribe('storage', (event) => {
      if (event.type === StorageEvents.STORAGE_UPDATE) {
        this.logger.info('Storage обновлен:', event)
      }
      if (event.type === StorageEvents.STORAGE_SELECT) {
        this.logger.info('Storage получен:', event)
      }
    })

    this.eventBus.subscribe('logger', (event) => {
      if (event.type === 'logger:entry') {
        const { level, message, data } = event.payload
        console.log(`[${level}] ${message}`, data)
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    await this.rootSegment.clear()
    await this.pluginManager.destroy()
    await super.destroy()
  }
}

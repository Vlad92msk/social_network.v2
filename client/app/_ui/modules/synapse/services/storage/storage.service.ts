import { Injectable } from '@ui/modules/synapse/decorators'
import { BaseModule } from '../core/base.service'
import { IDIContainer } from '../di-container/di-container.interface'
import { IndexedDBStorage } from './adapters/indexed-DB.service'
import { LocalStorage } from './adapters/local-storage.service'
import { MemoryStorage } from './adapters/memory-storage.service'
import { CacheConfig, CacheModule, CacheOptions } from './modules/cache/cache-module.service'
import { GlobalPluginManager } from './modules/plugin-manager/global-plugin-manager.service'
import { StoragePluginManager } from './modules/plugin-manager/plugin-manager.service'
import { IStoragePlugin } from './modules/plugin-manager/plugin-managers.interface'
import { SegmentManager, StorageFactory } from './modules/segment-manager/segment-manager.service'
import { CreateSegmentConfig, IStorageSegment, ResultFunction, Selector, SelectorAPI, SelectorOptions } from './modules/segment-manager/segment.interface'
import { IndexedDBStorageConfig, IStorage, LocalStorageConfig, MemoryStorageConfig, StorageEvents, StorageType } from './storage.interface'

export type StorageModuleConfig = {
  plugins?: IStoragePlugin[]
  cacheOptions?: boolean | CacheOptions
} & (
  | MemoryStorageConfig
  | LocalStorageConfig
  | IndexedDBStorageConfig
  )

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  private rootSegment!: IStorageSegment<Record<string, any>>

  static async create(config: StorageModuleConfig, parentContainer?: IDIContainer): Promise<StorageModule> {
    const m = new StorageModule(parentContainer)
    m.container.register({ id: 'STORAGE_CONFIG', instance: config })
    await m.initialize()
    return m
  }

  async initialize(): Promise<void> {
    await super.initialize()

    if (!this.config) {
      throw new Error('Storage configuration is required')
    }

    const rootConfig = {
      name: 'root',
      type: this.config.type,
      initialState: this.config.initialState,
      middlewares: this.config.middlewares,
      isRoot: true,
      ...(this.config.type === 'indexedDB' ? { options: this.config.options } : {}),
    }

    // Создаем корневой сегмент
    this.rootSegment = await this.segmentManager.createSegment(rootConfig)

    // Инициализируем глобальные плагины если они есть
    if (this.config.plugins?.length) {
      await Promise.all(
        this.config.plugins.map((plugin) => this.pluginManager.add(plugin)),
      )
    }
  }

  protected async registerServices(): Promise<void> {
    const createStorage: StorageFactory = async (config: CreateSegmentConfig<any>): Promise<IStorage> => {
      const pluginManager = config.isRoot
        ? this.container.get<GlobalPluginManager>('pluginManager')
        : undefined

      // Создаем базовое хранилище в зависимости от типа
      const createBaseStorage = (storageConfig: CreateSegmentConfig<any>): IStorage => {
        switch (storageConfig.type) {
          case 'localStorage':
            return new LocalStorage(
              storageConfig,
              pluginManager,
              this.eventBus,
              this.logger,
            )
          case 'indexedDB':
            return new IndexedDBStorage(
              storageConfig,
              pluginManager,
              this.eventBus,
              this.logger,
            )
          case 'memory':
          default:
            return new MemoryStorage(
              storageConfig,
              pluginManager,
              this.eventBus,
              this.logger,
            )
        }
      }

      const storageType: Record<StorageType, any> = {
        localStorage: LocalStorage,
        indexedDB: IndexedDBStorage,
        memory: MemoryStorage,
      }

      // Проверяем, нужно ли создавать кэшированное хранилище
      if (this.config.cacheOptions) {
        const cacheConfig: CacheConfig = {
          storage: storageType[config.type],
          storageConfig: config,
          pluginExecutor: pluginManager,
          cacheOptions: (typeof config?.cacheOptions === 'boolean' || config?.cacheOptions === undefined)
            ? {
              ttl: 1000 * 60 * 30, // 30 минут по умолчанию
              cleanup: {
                enabled: true,
                interval: 1000 * 60 * 60, // 1 час по умолчанию
              },
            }
            : config.cacheOptions,
        }

        return new CacheModule(cacheConfig)
      }

      // Если кэширование не требуется, возвращаем обычное хранилище
      return createBaseStorage(config)
    }

    // Регистрируем базовые сервисы
    this.container.register({
      id: 'createStorage',
      instance: createStorage,
    })

    // Создаем и регистрируем глобальный менеджер плагинов
    this.container.register({
      id: 'pluginManager',
      instance: new GlobalPluginManager(this.logger),
    })

    // Создаем менеджер сегментов
    const segmentManager = new SegmentManager(
      this.container.get('createStorage'),
      this.container.get('pluginManager'),
      this.logger,
    )

    this.container.register({
      id: 'segmentManager',
      instance: segmentManager,
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
        // this.logger.info('Storage обновлен:', event)
      }
      if (event.type === StorageEvents.STORAGE_PATCH) {
        // this.logger.info('Storage обновлен:', event)
      }
      if (event.type === StorageEvents.STORAGE_SELECT) {
        // this.logger.info('Storage получен:', event)
      }
    })

    this.eventBus.subscribe('logger', (event) => {
      if (event.type === 'logger:entry') {
        const { level, message, data } = event.payload
        // console.log(`[${level}] ${message}`, data)
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    await this.rootSegment.clear()
    await this.pluginManager.destroy()
    await super.destroy()
  }

  // Public API
  public async select<T>(selector: Selector<any, T>): Promise<T> {
    return this.rootSegment.select(selector)
  }

  public async update(updater: (state: any) => void): Promise<void> {
    return this.rootSegment.update(updater)
  }

  public async patch(value: any): Promise<void> {
    return this.rootSegment.patch(value)
  }

  public createSelector<T>(
    selectorOrDeps: Selector<any, T> | Array<SelectorAPI<any>>,
    resultFn?: ResultFunction<any[], T>,
    options?: SelectorOptions<T>,
  ): SelectorAPI<T> {
    if (Array.isArray(selectorOrDeps)) {
      return this.rootSegment.createSelector(
        selectorOrDeps,
        resultFn!,
        options,
      )
    }
    return this.rootSegment.createSelector(selectorOrDeps, options)
  }

  public async createSegment<T extends Record<string, any>>(
    config: CreateSegmentConfig<T>,
  ): Promise<IStorageSegment<T>> {
    return this.segmentManager.createSegment(config)
  }

  protected get config(): StorageModuleConfig {
    return this.container.get('STORAGE_CONFIG')
  }

  protected get pluginManager(): StoragePluginManager {
    return this.container.get('pluginManager')
  }

  protected get segmentManager(): SegmentManager {
    return this.container.get('segmentManager')
  }
}

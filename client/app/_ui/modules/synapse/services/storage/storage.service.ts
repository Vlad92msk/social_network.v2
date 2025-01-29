import { Inject, Injectable } from '@ui/modules/synapse/decorators'
import { IStorageConfig, StorageDependencies, StorageEvents } from './storage.interface'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { IndexedDBStorage } from './adapters/indexed-DB.service'
import { LocalStorage } from './adapters/local-storage.service'
import { MemoryStorage } from './adapters/memory-storage.service'
import { SelectorManager } from './modules/operations-manager/selector-manager.service'
import { GlobalPluginManager } from './modules/plugin-manager/global-plugin-manager.service'
import { StorageSegmentManager } from './modules/segment-manager/segment-manager.service'
import type {
  IStorage,
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

  static async create(config: RootStorageConfig, parentContainer?: IDIContainer): Promise<StorageModule> {
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

    // Создаем корневой сегмент после инициализации всех сервисов
    this.rootSegment = await this.segmentManager.createSegment({
      name: 'root',
      type: this.config.type,
      options: this.config.options,
      initialState: this.config.initialState,
      middlewares: this.config.middlewares,
      isRoot: true,
    })

    // Инициализируем плагины
    if (this.config.plugins?.length) {
      await this.pluginManager.initialize()
      await Promise.all(
        this.config.plugins.map((plugin) => this.pluginManager.add(plugin)),
      )
    }
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
    const createStorage: StorageFactory = async (options: StorageFactoryOptions): Promise<IStorage> => {
      const { type } = options

      // Формируем общую конфигурацию для хранилища
      const storageConfig: IStorageConfig = {
        ...this.config, // базовая конфигурация
        type, // тип хранилища из опций
        options: options.options, // специфичные опции (например для IndexedDB)
      }

      // Общие зависимости для всех типов хранилищ
      const dependencies: StorageDependencies = {
        config: storageConfig,
        pluginManager: this.container.get('pluginManager'),
        eventBus: this.eventBus,
        logger: this.logger,
      }

      // Создаем нужный тип хранилища
      switch (type) {
        case 'localStorage': return new LocalStorage(dependencies)
        case 'indexDB': return new IndexedDBStorage(dependencies)
        case 'memory':
        default: return new MemoryStorage(dependencies)
      }
    }
    this.container.register({ id: 'createStorage', instance: createStorage })

    // 2. Регистрируем selectorManager
    this.container.register({
      id: 'selectorManager',
      instance: new SelectorManager(),
    })

    // 3. Создаем и регистрируем pluginManager
    this.container.register({
      id: 'pluginManager',
      instance: new GlobalPluginManager(this.container.get('eventBus')),
    })

    const segmentManager = new StorageSegmentManager(
      this.container.get('selectorManager'),
      this.container.get('createStorage'),
      this.container.get('pluginManager'),
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

  protected get config(): RootStorageConfig {
    return this.container.get('STORAGE_CONFIG')
  }

  protected get pluginManager(): GlobalPluginManager {
    return this.container.get('pluginManager')
  }

  protected get segmentManager(): StorageSegmentManager {
    return this.container.get('segmentManager')
  }

  protected get selectorManager(): SelectorManager {
    return this.container.get('selectorManager')
  }
}

// Использование StorageModule как дочернего:
// class ParentModule extends BaseModule {
//   protected async registerServices(): Promise<void> {
//     const storageModule = await StorageModule.create({
//       type: 'memory',
//       // другие настройки
//     }, this.container) // передаем наш контейнер как родительский
//
//     this.registerChildModule('storage', storageModule)
//   }
// }

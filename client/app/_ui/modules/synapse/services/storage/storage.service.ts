import { MemoryStorage } from './memory-storage.service'
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import { Middleware } from '../core/core.interface'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import type { Event, IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  constructor(
    container: IDIContainer,
    @Inject('STORAGE_CONFIG') private readonly config: IStorageConfig,
  ) {
    super(container)
    if (!config) throw new Error('StorageConfig is required')
  }

  static create(config: IStorageConfig, parentContainer?: IDIContainer): StorageModule {
    const container = new DIContainer({ parent: parentContainer })

    // Регистрируем конфиг
    container.register({ id: 'STORAGE_CONFIG', instance: config })

    return container.resolve(StorageModule)
  }

  protected async registerServices(): Promise<void> {
    // Регистрируем плагин менеджер
    const pluginManager = this.container.resolve(StoragePluginManager)

    // Регистрируем плагины из конфига
    if (this.config.plugins) {
      for (const plugin of this.config.plugins) {
        await pluginManager.add(plugin)
      }
    }

    // Регистрируем middlewares если они есть
    if (this.config.middlewares) {
      const defaultMiddleware = this.getDefaultMiddleware()
      const middlewares = this.config.middlewares(
        () => defaultMiddleware,
      )
      for (const middleware of middlewares) {
        this.container.use(middleware)
      }
    }

    this.container.register({ id: 'pluginManager', instance: pluginManager })
    this.container.register({ id: 'storage', instance: this.createStorage() })
  }

  protected async setupEventHandlers(): Promise<void> {
    const eventBus = this.container.get<IEventBus>('eventBus')
    const logger = this.container.get<ILogger>('logger')

    eventBus.subscribe('storage:changed', async (event) => {
      logger.debug('Storage changed:', event.payload)
    })

    eventBus.subscribe('app:cleanup', async () => {
      await this.cleanupResources()
    })
  }

  protected async cleanupResources(): Promise<void> {
    const storage = this.getStorage()
    await storage.clear()
  }

  private async createStorage() {
    switch (this.config.type) {
      // case 'localStorage':
      //   return this.container.resolve(LocalStorage)
      // case 'indexedDB':
      //   return this.container.resolve(IndexedDBStorage)
      // case 'memory':
      default:
        return this.container.resolve(MemoryStorage)
    }
  }

  private getDefaultMiddleware(): Middleware[] {
    return [
      // Добавьте здесь дефолтные middleware
    ]
  }

  // Публичный API
  public getStorage(): IStorage {
    return this.container.get<IStorage>('storage')
  }

  public async set<T>(key: string, value: T): Promise<void> {
    const storage = this.getStorage()
    const eventBus = this.container.get<IEventBus>('eventBus')

    await storage.set(key, value)
    await eventBus.emit({
      type: 'storage:value:changed',
      payload: { key, value },
    })
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const storage = this.getStorage()
    return storage.get<T>(key)
  }
}

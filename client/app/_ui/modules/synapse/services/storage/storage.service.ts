import { MemoryStorage } from './memory-storage.service'
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import type { IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  constructor(
    private readonly config: IStorageConfig,
    protected readonly container: IDIContainer,
    protected readonly logger: ILogger,
    protected readonly eventBus: IEventBus,
  ) {
    super()
  }

  protected async registerServices(): Promise<void> {
    // Регистрируем менеджер плагинов
    const pluginManager = this.container.resolve(StoragePluginManager)

    // Регистрируем в контейнере
    this.container.register({
      id: 'storagePluginManager',
      instance: pluginManager,
    })

    if (this.config.plugins) {
      this.config.plugins.forEach((plugin) => pluginManager.add(plugin))
    }

    // Создаем хранилище через DI
    const storage = this.createStorage()

    // Регистрируем хранилище
    this.container.register({
      id: 'storage',
      instance: storage,
    })
  }

  protected async setupEventHandlers(): Promise<void> {
    // Подписываемся на необходимые события
    // Например, синхронизация состояния между вкладками
  }

  protected async cleanupResources(): Promise<void> {
    const storage = this.container.get<IStorage>('storage')
    await storage.clear()
  }

  private createStorage(): IStorage {
    switch (this.config.type) {
      default:
        // Создаем через DI
        return this.container.resolve(MemoryStorage, [this.config])
    }
  }
}

import { ICoreConfig } from './core.interface'
import { CorePluginManager } from './plugin-manager.service'
import { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import { IEventBus } from '../event-bus/event-bus.interface'
import { SegmentedEventBus } from '../event-bus/event-bus.service'
import { EventBusLogger } from '../logger/collectors/event-bus-logger.collector'
import { ILogger } from '../logger/logger.interface'
import { Logger } from '../logger/logger.service'
import { IStorageConfig } from '../storage/storage.interface'
import { StorageModule } from '../storage/storage.service'

export class Synapse {
  private container: IDIContainer

  private logger: ILogger

  private eventBus: IEventBus

  private storageModule?: StorageModule

  constructor() {
    this.initializeCore()
  }

  private initializeCore(): void {
    this.eventBus = new SegmentedEventBus()
    this.logger = new Logger().addCollector(
      new EventBusLogger(this.eventBus as SegmentedEventBus),
    )

    this.container = new DIContainer({
      defaultSingleton: true,
      enableLogging: true,
    })

    this.container.register({ id: 'eventBus', instance: this.eventBus })
    this.container.register({ id: 'logger', instance: this.logger })
  }

  withStorage(config: IStorageConfig): this {
    // Создаем модуль
    this.storageModule = StorageModule.createWithParent(
      config,
      this.container,
    )

    // Регистрируем его в контейнере, чтобы другие модули могли его использовать
    this.container.register({
      id: 'storageModule',
      instance: this.storageModule,
    })

    return this
  }

  withCore(config: ICoreConfig): this {
    if (config.plugins) {
      const pluginManager = this.container.resolve(CorePluginManager)
      config.plugins.forEach((plugin) => pluginManager.add(plugin))
    }
    return this
  }

  async build() {
    try {
      this.logger.info('Starting Synapse initialization')

      if (this.storageModule) {
        await this.storageModule.initialize()
      }

      return {
        storage: this.storageModule,
        shutdown: async () => {
          if (this.storageModule) {
            await this.storageModule.destroy()
          }
        },
      }
    } catch (error) {
      this.logger.error('Failed to initialize Synapse', error)
      throw error
    }
  }
}

// Factory function
export const createSynapse = () => new Synapse()

import { ICoreConfig } from '@ui/modules/synapse/services/core/core.interface'
import { IStorageConfig } from '@ui/modules/synapse/services/storage/storage.interface'
import { CorePluginManager } from './plugin-manager.service'
import { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import { IEventBus } from '../event-bus/event-bus.interface'
import { SegmentedEventBus } from '../event-bus/event-bus.service'
import { EventBusLogger } from '../logger/collectors/event-bus-logger.collector'
import { ILogger } from '../logger/logger.interface'
import { Logger } from '../logger/logger.service'
import { StorageModule } from '../storage/storage.service'

export class Synapse {
  private container: IDIContainer

  private logger: ILogger

  private eventBus: IEventBus

  private storageModule?: StorageModule

  constructor() {
    // Инициализируем в правильном порядке
    this.eventBus = new SegmentedEventBus()
    this.logger = new Logger().addCollector(new EventBusLogger(this.eventBus as SegmentedEventBus))

    this.container = new DIContainer()
    this.container.register({
      id: 'eventBus',
      instance: this.eventBus,
    })
    this.container.register({
      id: 'logger',
      instance: this.logger,
    })
  }

  withCore(config: ICoreConfig): this {
    if (config.plugins) {
      const pluginManager = this.container.resolve(CorePluginManager)
      config.plugins.forEach((plugin) => pluginManager.add(plugin))
    }
    return this
  }

  withStorage(config: IStorageConfig): this {
    this.storageModule = new StorageModule(
      config,
      this.container,
      this.logger,
      this.eventBus,
    )
    return this
  }

  async build() {
    try {
      this.logger.info('Starting Synapse initialization')

      if (this.storageModule) {
        await this.storageModule.initialize()
      }

      this.logger.info('Synapse initialized successfully')

      return {
        shutdown: async () => {
          this.logger.info('Starting Synapse shutdown')
          if (this.storageModule) {
            await this.storageModule.destroy()
          }
          this.logger.info('Synapse shutdown completed')
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

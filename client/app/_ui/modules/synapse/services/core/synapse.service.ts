import { IEventBus } from '@ui/modules/synapse/services/event-bus/event-bus.interface'
import { BaseModule } from './base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import { IStorageConfig } from '../storage/storage.interface'
import { StorageModule } from '../storage/storage.service'

export class Synapse extends BaseModule {
  readonly name = 'synapse'

  constructor(container: IDIContainer) {
    super(container)
  }

  static create(parentContainer?: IDIContainer): Synapse {
    const container = new DIContainer({ parent: parentContainer })
    return new Synapse(container)
  }

  withStorage(config: IStorageConfig): this {
    try {
      if (this.container.has('storage')) {
        return this
      }

      const storageModule = StorageModule.create(config, this.container)
      this.registerChildModule('storage', storageModule)
      return this
    } catch (error) {
      throw new Error(`Failed to initialize storage module: ${error.message}`)
    }
  }

  protected async registerServices(): Promise<void> {}

  protected async setupEventHandlers(): Promise<void> {
    const eventBus = this.container.get<IEventBus>('eventBus')

    // Меняем с 'app:cleanup' на 'app'
    eventBus.subscribe('app', async (event) => {
      if (event.type === 'app:cleanup') {
        await this.cleanupResources()
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    // Очищаем ресурсы storage если он есть
  }

  async build() {
    const storage = this.getChildModule<StorageModule>('storage')
    if (!storage) {
      throw new Error('Storage module is required but not initialized')
    }

    await this.initialize()

    return { storage }
  }
}

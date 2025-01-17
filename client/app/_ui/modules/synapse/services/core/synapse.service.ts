import { BaseModule } from './base.service'
import { Injectable } from '../../decorators'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import { IStorageConfig } from '../storage/storage.interface'
import { StorageModule } from '../storage/storage.service'

@Injectable()
export class Synapse extends BaseModule {
  readonly name = 'synapse'

  constructor(container: IDIContainer) {
    super(container)
  }

  static create(parentContainer?: IDIContainer): Synapse {
    const container = new DIContainer({ parent: parentContainer })
    return container.resolve(Synapse)
  }

  withStorage(config: IStorageConfig): this {
    // Создаем и регистрируем модуль одним методом
    this.registerChildModule('storage', StorageModule.create(config, this.container))
    return this
  }

  protected async registerServices(): Promise<void> {}

  protected async setupEventHandlers(): Promise<void> {}

  protected async cleanupResources(): Promise<void> {}

  async build() {
    await this.initialize()
    return {
      storage: this.getChildModule<StorageModule>('storage'),
    }
  }
}

// Пример использования:
// const synapse = Synapse.create()
//   .withStorage({ type: 'memory' })
//   .withQuery({ /* query config */ })
//
// const { storage, query } = await synapse.build()
//
// // Query использует Storage
// await query.executeQuery('some-query')
//
// // Storage уведомляет Query об изменениях через EventBus
// await storage.set('key', 'value')

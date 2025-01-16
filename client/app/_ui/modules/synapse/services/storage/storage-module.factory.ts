// storage/storage.factory.ts
import { IStorageConfig } from './storage.interface'
import { StorageModule } from './storage.service'
import { Injectable } from '../../decorators'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import type { IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class StorageModuleFactory {
  constructor(
    private readonly container: IDIContainer,
    private readonly logger: ILogger,
    private readonly eventBus: IEventBus,
  ) {}

  create(config: IStorageConfig): StorageModule {
    // Создаем новый DI контейнер для модуля
    const moduleContainer = new DIContainer({
      defaultSingleton: true,
      parent: this.container,
    })

    return new StorageModule(
      config,
      moduleContainer,
      this.logger,
      this.eventBus,
    )
  }
}

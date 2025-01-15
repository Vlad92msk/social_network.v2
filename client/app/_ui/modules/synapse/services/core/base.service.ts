// base.service.ts
import { IModule } from './core.interface'
import { Injectable } from '../../decorators'
import type { IDIContainer } from '../di-container/di-container.interface'
import type { IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export abstract class BaseModule implements IModule {
  abstract readonly name: string

  protected abstract container: IDIContainer

  protected abstract logger: ILogger

  protected abstract eventBus: IEventBus

  async initialize(): Promise<void> {
    try {
      this.logger.debug(`Initializing module: ${this.name}`)

      // Регистрируем сервисы модуля
      await this.registerServices()

      // Устанавливаем обработчики событий
      await this.setupEventHandlers()

      this.logger.info(`Module ${this.name} initialized successfully`)
    } catch (error) {
      this.logger.error(`Failed to initialize module ${this.name}`, error)
      throw error
    }
  }

  async destroy(): Promise<void> {
    try {
      this.logger.debug(`Destroying module: ${this.name}`)

      // Очищаем ресурсы
      await this.cleanupResources()

      this.logger.info(`Module ${this.name} destroyed successfully`)
    } catch (error) {
      this.logger.error(`Failed to destroy module ${this.name}`, error)
      throw error
    }
  }

  protected abstract registerServices(): Promise<void>

  protected abstract setupEventHandlers(): Promise<void>

  protected abstract cleanupResources(): Promise<void>
}

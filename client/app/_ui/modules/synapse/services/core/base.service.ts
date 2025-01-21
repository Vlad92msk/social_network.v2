// base.service.ts
import { Injectable } from '@ui/modules/synapse/decorators'
import { IModule } from './core.interface'
import type { IDIContainer } from '../di-container/di-container.interface'
import type { IEventBus } from '../event-bus/event-bus.interface'
import { SegmentedEventBus } from '../event-bus/event-bus.service'
import { EventBusLogger } from '../logger/collectors/event-bus-logger.collector'
import type { ILogger } from '../logger/logger.interface'
import { Logger } from '../logger/logger.service'

@Injectable()
export abstract class BaseModule implements IModule {
  abstract readonly name: string

  protected children: Map<string, BaseModule> = new Map()

  protected get eventBus(): IEventBus {
    return this.container.get('eventBus')
  }

  protected get logger(): ILogger {
    return this.container.get('logger')
  }

  protected constructor(
    protected readonly container: IDIContainer,
  ) {
    if (!container.getParent()) {
      this.setupBaseServices()
    }
  }

  private setupBaseServices(): void {
    if (!this.container.has('eventBus')) {
      const eventBus = new SegmentedEventBus()
      // Создаем базовые сегменты
      eventBus.createSegment('app:cleanup')
      this.container.register({ id: 'eventBus', instance: eventBus })
    }

    if (!this.container.has('logger')) {
      const eventBus = this.container.get<SegmentedEventBus>('eventBus')
      const logger = new Logger()
      logger.addCollector(new EventBusLogger(eventBus))
      this.container.register({ id: 'logger', instance: logger })
    }
  }

  // Управление дочерними модулями
  protected registerChildModule<T extends BaseModule>(id: string, child: T): T {
    // Регистрируем в контейнере
    this.container.register({ id, instance: child })
    // Добавляем в Map детей для управления жизненным циклом
    this.children.set(child.name, child)
    return child
  }

  protected getChildModule<T extends BaseModule>(id: string): T {
    return this.container.get<T>(id)
  }

  // Жизненный цикл
  async initialize(): Promise<void> {
    try {
      await this.registerServices()
      await this.setupEventHandlers()

      // Инициализируем дочерние модули
      for (const child of this.children.values()) {
        await child.initialize()
      }
    } catch (error) {
      this.logger.error(`Failed to initialize module ${this.name}`, error)
      throw error
    }
  }

  async destroy(): Promise<void> {
    try {
      // Уничтожаем дочерние модули
      for (const child of this.children.values()) {
        await child.destroy()
      }

      await this.cleanupResources()
      this.children.clear()
    } catch (error) {
      this.logger.error(`Failed to destroy module ${this.name}`, error)
      throw error
    }
  }

  // Абстрактные методы
  protected abstract registerServices(): Promise<void>

  protected abstract setupEventHandlers(): Promise<void>

  protected abstract cleanupResources(): Promise<void>
}

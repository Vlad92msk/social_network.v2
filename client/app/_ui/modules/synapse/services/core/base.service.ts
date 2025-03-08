// base.service.ts
import { IModule } from './core.interface'
import { Injectable } from '../../decorators'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import type { IEventBus } from '../event-bus/event-bus.interface'
import { SegmentedEventBus } from '../event-bus/event-bus.service'
import { EventBusLogger } from '../logger/collectors/event-bus-logger.collector'
import type { ILogger } from '../logger/logger.interface'
import { Logger } from '../logger/logger.service'


export enum StorageEvents {
  STORAGE_UPDATE = 'storage:update',
  STORAGE_DELETE = 'storage:delete',
  STORAGE_PATCH = 'storage:patch',
  STORAGE_SELECT = 'storage:select',
  STORAGE_CLEAR = 'storage:clear',
  STORAGE_DESTROY = 'storage:destroy',
}

@Injectable()
export abstract class BaseModule implements IModule {
  abstract readonly name: string

  protected children: Map<string, BaseModule> = new Map()

  protected container: IDIContainer

  protected constructor(parentContainer?: IDIContainer) {
    // Создаем локальный контейнер для каждого модуля
    this.container = new DIContainer({ parent: parentContainer })
    this.container.register({ id: 'container', instance: this.container })

    // Регистрируем базовые сервисы только если нет родительского контейнера
    if (!parentContainer) {
      this.setupBaseServices()
    }
  }

  protected get logger(): ILogger {
    return this.container.get('logger')
  }

  protected get eventBus(): IEventBus {
    return this.container.get('eventBus')
  }

  private setupBaseServices(): void {
    if (!this.container.has('eventBus')) {
      const eventBus = new SegmentedEventBus()

      eventBus.createSegment({
        name: 'app',
        eventTypes: ['app:cleanup', 'app:initialize'],
        priority: 1000,
      })

      eventBus.createSegment({
        name: 'storage',
        eventTypes: Object.values(StorageEvents),
        priority: 100,
      })

      eventBus.createSegment({
        name: 'logger',
        eventTypes: ['logger:entry', 'logger:error'],
        priority: 100,
      })

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
  public registerChildModule<T extends BaseModule>(id: string, child: T): T {
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
      // Регистрируем сервисы до установки обработчиков событий
      await this.registerServices()
      await this.setupEventHandlers()

      await this.eventBus?.emit({
        type: 'app:initialize',
        payload: { moduleName: this.name },
      })

      for (const child of this.children.values()) {
        await child.initialize()
      }
    } catch (error) {
      this.logger?.error(`Failed to initialize module ${this.name}`, error)
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

  /**
   * Регистрирует сервисы модуля в DI контейнере
   * Переопределите для добавления своих сервисов
   * Пример: this.container.register({ id: 'userService', instance: new UserService() })
   */
  protected abstract registerServices(): Promise<void>

  /**
   * Устанавливает обработчики событий
   * Переопределите для подписки на события
   * Пример: this.eventBus.subscribe('user:created', this.handleUserCreated)
   */
  protected abstract setupEventHandlers(): Promise<void>

  /**
   * Очищает ресурсы модуля
   * Переопределите для очистки таймеров, отписки от событий и т.д.
   * Пример: clearInterval(this.syncInterval)
   */
  protected abstract cleanupResources(): Promise<void>
}

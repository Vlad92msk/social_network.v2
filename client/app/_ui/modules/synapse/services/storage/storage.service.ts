import { MemoryStorage } from './memory-storage.service'
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import type { Event, IEventBus } from '../event-bus/event-bus.interface'
import { SegmentedEventBus } from '../event-bus/event-bus.service'
import type { ILogger } from '../logger/logger.interface'
import { Logger } from '../logger/logger.service'

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  // Собственная шина событий модуля
  private readonly moduleEventBus: IEventBus

  constructor(
    @Inject('STORAGE_CONFIG') private readonly config: IStorageConfig,
    container: IDIContainer,
    logger: ILogger,
    eventBus: IEventBus,
  ) {
    super(container, logger, eventBus) // Передаем в базовый класс
    if (!config) throw new Error('StorageConfig is required')

    this.moduleEventBus = new SegmentedEventBus()
  }

  /**
   * Создает полностью независимый экземпляр модуля
   */
  static create(config: IStorageConfig): StorageModule {
    // Создаем новый контейнер
    const container = new DIContainer()

    // Создаем базовые сервисы
    const logger = new Logger()
    const eventBus = new SegmentedEventBus()

    // Регистрируем все необходимые сервисы
    container.register({ id: 'STORAGE_CONFIG', instance: config })
    container.register({ id: 'logger', instance: logger })
    container.register({ id: 'eventBus', instance: eventBus })
    container.register({ id: 'storagePluginManager', type: StoragePluginManager })

    // Создаем модуль через DI
    return container.resolve(StorageModule)
  }

  /**
   * Создает экземпляр модуля, связанный с родительским контейнером
   */
  static createWithParent(
    config: IStorageConfig,
    parentContainer: IDIContainer,
  ): StorageModule {
    // Создаем контейнер с доступом к родительскому
    const moduleContainer = new DIContainer({
      parent: parentContainer,
    })

    // Регистрируем только специфичные для модуля сервисы
    // Остальные будут браться из родительского контейнера
    moduleContainer.register({ id: 'STORAGE_CONFIG', instance: config })
    moduleContainer.register({ id: 'storagePluginManager', type: StoragePluginManager })

    return moduleContainer.resolve(StorageModule)
  }

  /**
   * Регистрация сервисов модуля (из BaseModule)
   */
  protected async registerServices(): Promise<void> {
    // Регистрируем локальную шину событий
    this.container.register({
      id: 'moduleEventBus',
      instance: this.moduleEventBus,
    })

    // Регистрируем тип хранилища
    this.container.register({
      id: 'memoryStorage',
      type: MemoryStorage,
    })

    // Создаем и регистрируем экземпляр хранилища
    const storage = this.createStorage()
    this.container.register({
      id: 'storage',
      instance: storage,
    })
  }

  /**
   * Настройка обработчиков событий (из BaseModule)
   */
  protected async setupEventHandlers(): Promise<void> {
    // Пробрасываем локальные события в глобальную шину
    this.moduleEventBus.subscribe('storage:changed', async (event: Event) => {
      await this.eventBus.emit(event)
    })

    // Слушаем глобальные события
    this.eventBus.subscribe('app:cleanup', async (event: Event) => {
      await this.moduleEventBus.emit({
        type: 'cleanup',
        payload: event.payload,
      })
    })
  }

  /**
   * Очистка ресурсов при уничтожении модуля (из BaseModule)
   */
  protected async cleanupResources(): Promise<void> {
    const storage = this.getStorage()
    await storage.clear()
  }

  /**
   * Создание экземпляра хранилища
   */
  private createStorage(): IStorage {
    switch (this.config.type) {
      case 'localStorage':
        // Здесь можно добавить другие типы хранилищ
        throw new Error('LocalStorage not implemented yet')
      default:
        return this.container.resolve(MemoryStorage)
    }
  }

  // Публичное API модуля

  public getStorage(): IStorage {
    return this.container.get<IStorage>('storage')
  }

  public async set(key: string, value: any): Promise<void> {
    const storage = this.getStorage()
    await storage.set(key, value)
    await this.moduleEventBus.emit({
      type: 'storage:changed',
      payload: { key, value },
    })
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const storage = this.getStorage()
    return storage.get<T>(key)
  }
}

// base-storage.service.ts
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import type { Event, IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export abstract class BaseStorage implements IStorage {
  constructor(
    @Inject('STORAGE_CONFIG') protected readonly config: IStorageConfig,
    protected readonly pluginManager: StoragePluginManager,
    @Inject('eventBus') protected readonly eventBus: IEventBus,
    protected readonly logger: ILogger,
  ) {}

  protected async emitEvent(event: Event): Promise<void> {
    try {
      await this.eventBus.emit({
        ...event,
        metadata: {
          ...(event.metadata || {}),
          timestamp: Date.now(),
          storageType: this.config.type || 'memory',
        },
      })
    } catch (error) {
      this.logger.error('Error emitting event', { event, error })
    }
  }

  /**
   * Получение значения по ключу
   * @param key Ключ для получения значения
   * @returns Promise с значением или undefined, если значение не найдено
   */
  abstract get<T>(key: string): Promise<T | undefined>

  /**
   * Установка значения по ключу
   * @param key Ключ для сохранения значения
   * @param value Значение для сохранения
   * @returns Promise завершающийся после сохранения
   */
  abstract set<T>(key: string, value: T): Promise<void>

  /**
   * Проверка наличия значения по ключу
   * @param key Ключ для проверки
   * @returns Флаг наличия значения
   */
  abstract has(key: string): boolean

  /**
   * Удаление значения по ключу
   * @param key Ключ для удаления
   * @returns Promise завершающийся после удаления
   */
  abstract delete(key: string): Promise<void>

  /**
   * Очистка всего хранилища
   * @returns Promise завершающийся после очистки
   */
  abstract clear(): Promise<void>
}

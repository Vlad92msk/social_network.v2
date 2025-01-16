import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import type { IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class MemoryStorage implements IStorage {
  // Внутреннее хранилище данных
  private storage: Map<string, any> = new Map()

  constructor(
    // Конфиг из StorageModule
    @Inject('STORAGE_CONFIG') private readonly config: IStorageConfig,
    // Менеджер плагинов для обработки данных
    private readonly pluginManager: StoragePluginManager,
    // Локальная шина событий модуля
    @Inject('moduleEventBus') private readonly eventBus: IEventBus,
    // Сервис логирования
    private readonly logger: ILogger,
  ) {}

  /**
   * Получение значения из хранилища
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      // Даем плагинам возможность обработать ключ
      const processedKey = this.pluginManager.executeBeforeGet(key)

      // Получаем значение
      const value = this.storage.get(processedKey) as T | undefined

      // Даем плагинам возможность обработать значение
      const processedValue = this.pluginManager.executeAfterGet(processedKey, value)

      // Уведомляем о получении значения
      await this.eventBus.emit({
        type: 'storage:value:accessed',
        payload: { key: processedKey, value: processedValue },
      })

      return processedValue
    } catch (error) {
      this.logger.error('Error getting value', { key, error })
      throw error
    }
  }

  /**
   * Сохранение значения в хранилище
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      // Даем плагинам возможность обработать значение перед сохранением
      const processedValue = this.pluginManager.executeBeforeSet(key, value)

      // Сохраняем значение
      this.storage.set(key, processedValue)

      // Уведомляем плагины о сохранении
      this.pluginManager.executeAfterSet(key, processedValue)

      // Отправляем событие об изменении значения
      await this.eventBus.emit({
        type: 'storage:value:changed',
        payload: { key, value: processedValue },
        metadata: {
          timestamp: Date.now(),
          storageType: 'memory',
        },
      })

      this.logger.debug('Value set successfully', { key })
    } catch (error) {
      this.logger.error('Error setting value', { key, error })
      throw error
    }
  }

  /**
   * Проверка наличия значения
   */
  has(key: string): boolean {
    return this.storage.has(key)
  }

  /**
   * Удаление значения
   */
  async delete(key: string): Promise<void> {
    try {
      // Спрашиваем у плагинов разрешение на удаление
      if (this.pluginManager.executeBeforeDelete(key)) {
        this.storage.delete(key)

        // Уведомляем плагины об удалении
        this.pluginManager.executeAfterDelete(key)

        // Отправляем событие об удалении
        await this.eventBus.emit({
          type: 'storage:value:deleted',
          payload: { key },
        })

        this.logger.debug('Value deleted successfully', { key })
      }
    } catch (error) {
      this.logger.error('Error deleting value', { key, error })
      throw error
    }
  }

  /**
   * Очистка всего хранилища
   */
  async clear(): Promise<void> {
    try {
      // Уведомляем плагины о начале очистки
      this.pluginManager.executeOnClear()

      // Очищаем хранилище
      this.storage.clear()

      // Отправляем событие об очистке
      await this.eventBus.emit({
        type: 'storage:cleared',
      })

      this.logger.debug('Storage cleared successfully')
    } catch (error) {
      this.logger.error('Error clearing storage', { error })
      throw error
    }
  }
}

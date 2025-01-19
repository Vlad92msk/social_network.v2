import { BaseStorage } from './base-storage.service'
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorageConfig } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import type { IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class MemoryStorage extends BaseStorage {
  private storage: Map<string, any>

  constructor(
    @Inject('STORAGE_CONFIG') config: IStorageConfig,
    @Inject('eventBus') eventBus: IEventBus,
      pluginManager: StoragePluginManager,
      logger: ILogger,
  ) {
    super(config, pluginManager, eventBus, logger)
    this.storage = new Map(Object.entries(config.initialState || {}))
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const processedKey = this.pluginManager.executeBeforeGet(key)
      const value = this.storage.get(processedKey) as T | undefined
      const processedValue = this.pluginManager.executeAfterGet(processedKey, value)

      await this.emitEvent({
        type: 'storage:value:accessed',
        payload: { key: processedKey, value: processedValue },
      })

      return processedValue
    } catch (error) {
      this.logger.error('Error getting value', { key, error })
      throw error
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const processedValue = this.pluginManager.executeBeforeSet(key, value)
      this.storage.set(key, processedValue)
      this.pluginManager.executeAfterSet(key, processedValue)

      await this.emitEvent({
        type: 'storage:value:changed',
        payload: { key, value: processedValue },
      })

      this.logger.debug('Value set successfully', { key })
    } catch (error) {
      this.logger.error('Error setting value', { key, error })
      throw error
    }
  }

  has(key: string): boolean {
    return this.storage.has(key)
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.pluginManager.executeBeforeDelete(key)) {
        this.storage.delete(key)
        this.pluginManager.executeAfterDelete(key)

        await this.emitEvent({
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

  async clear(): Promise<void> {
    try {
      this.pluginManager.executeOnClear()
      this.storage.clear()

      await this.emitEvent({
        type: 'storage:cleared',
      })

      this.logger.debug('Storage cleared successfully')
    } catch (error) {
      this.logger.error('Error clearing storage', { error })
      throw error
    }
  }
}

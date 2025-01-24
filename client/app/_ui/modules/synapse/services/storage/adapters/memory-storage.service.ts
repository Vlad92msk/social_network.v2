import { BaseStorage } from './base-storage.service'
import { StoragePluginManager } from '../plugin-manager.service'
import type { IStorageConfig } from '../storage.interface'
import { Inject, Injectable } from '../../../decorators'
import type { IEventBus } from '../../event-bus/event-bus.interface'
import type { ILogger } from '../../logger/logger.interface'

@Injectable()
export class MemoryStorage extends BaseStorage {
  private storage = new Map<string, any>()

  constructor(
    @Inject('STORAGE_CONFIG') config: IStorageConfig,
    @Inject('pluginManager') pluginManager: StoragePluginManager,
    @Inject('eventBus') eventBus: IEventBus,
    @Inject('logger') logger: ILogger,
  ) {
    super(config, pluginManager, eventBus, logger)
    if (config.initialState) {
      Object.entries(config.initialState).forEach(([key, value]) => {
        this.storage.set(key, value)
      })
    }
  }

  protected async doGet(key: string): Promise<any> {
    return this.storage.get(key)
  }

  protected async doSet(key: string, value: any): Promise<void> {
    this.storage.set(key, value)
  }

  protected async doDelete(key: string): Promise<boolean> {
    return this.storage.delete(key)
  }

  protected async doClear(): Promise<void> {
    this.storage.clear()
  }

  protected async doKeys(): Promise<string[]> {
    return Array.from(this.storage.keys())
  }

  protected async doHas(key: string): Promise<boolean> {
    return this.storage.has(key)
  }

  protected async doDestroy(): Promise<void> {
    // Для MemoryStorage достаточно очистки Map
    this.storage.clear()
  }
}

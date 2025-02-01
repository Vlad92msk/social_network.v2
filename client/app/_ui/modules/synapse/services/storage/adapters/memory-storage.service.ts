import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import { IEventEmitter, ILogger, StorageConfig } from '../storage.interface'
import { BaseStorage } from './base-storage.service'

export class MemoryStorage extends BaseStorage {
  private storage = new Map<string, any>()

  constructor(
    config: StorageConfig,
    pluginExecutor?: IPluginExecutor,
    eventEmitter?: IEventEmitter,
    logger?: ILogger,
  ) {
    super(config, pluginExecutor, eventEmitter, logger)

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
    this.storage.clear()
  }
}

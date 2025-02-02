import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import { IEventEmitter, ILogger, StorageConfig } from '../storage.interface'
import { BaseStorage } from './base-storage.service'

export class LocalStorage extends BaseStorage {
  constructor(
    config: StorageConfig,
    pluginExecutor?: IPluginExecutor,
    eventEmitter?: IEventEmitter,
    logger?: ILogger,
  ) {
    super(config, pluginExecutor, eventEmitter, logger)

    if (config.initialState) {
      // Устанавливаем initialState только для отсутствующих ключей
      Object.entries(config.initialState).forEach(([key, value]) => {
        if (localStorage.getItem(key) === null) {
          localStorage.setItem(key, JSON.stringify(value))
        }
      })
    }
  }

  protected async doGet(key: string): Promise<any> {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : undefined
  }

  protected async doSet(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value))
  }

  protected async doDelete(key: string): Promise<boolean> {
    const exists = await this.doHas(key)
    localStorage.removeItem(key)
    return exists
  }

  protected async doClear(): Promise<void> {
    localStorage.clear()
  }

  protected async doKeys(): Promise<string[]> {
    return Object.keys(localStorage)
  }

  protected async doHas(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null
  }

  protected async doDestroy(): Promise<void> {
    // Специфичной очистки не требуется
  }
}

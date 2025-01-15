import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { Injectable } from '../../decorators'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class MemoryStorage implements IStorage {
  private storage: Map<string, any> = new Map()

  constructor(
    private readonly pluginManager: StoragePluginManager,
    private readonly logger: ILogger,
    private readonly config: IStorageConfig,
  ) {}

  get<T>(key: string): T | undefined {
    const processedKey = this.pluginManager.executeBeforeGet(key)
    const value = this.storage.get(processedKey) as T | undefined
    return this.pluginManager.executeAfterGet(processedKey, value)
  }

  set<T>(key: string, value: T): void {
    const processedValue = this.pluginManager.executeBeforeSet(key, value)
    this.storage.set(key, processedValue)
    this.pluginManager.executeAfterSet(key, processedValue)
  }

  has(key: string): boolean {
    return this.storage.has(key)
  }

  delete(key: string): void {
    if (this.pluginManager.executeBeforeDelete(key)) {
      this.storage.delete(key)
      this.pluginManager.executeAfterDelete(key)
    }
  }

  clear(): void {
    this.pluginManager.executeOnClear()
    this.storage.clear()
  }
}

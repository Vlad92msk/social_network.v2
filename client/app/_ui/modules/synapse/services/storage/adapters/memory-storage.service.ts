import { getValueByPath, setValueByPath } from '@ui/modules/synapse/services/storage/adapters/path.utils'
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
      this.storage.set(this.name, config.initialState)
    }
  }

  protected async doGet(key: string): Promise<any> {
    const [rootKey, ...pathParts] = key.split('.')
    const rootValue = this.storage.get(rootKey)

    if (!pathParts.length) {
      return rootValue
    }

    return getValueByPath(rootValue, pathParts.join('.'))
  }

  protected async doSet(key: string, value: any): Promise<void> {
    const [rootKey, ...pathParts] = key.split('.')

    if (!pathParts.length) {
      this.storage.set(rootKey, value)
      return
    }

    const rootValue = this.storage.get(rootKey) || {}
    const newValue = setValueByPath({ ...rootValue }, pathParts.join('.'), value)
    this.storage.set(rootKey, newValue)
  }

  protected async doDelete(key: string): Promise<boolean> {
    const [rootKey, ...pathParts] = key.split('.')

    if (!pathParts.length) {
      return this.storage.delete(rootKey)
    }

    const rootValue = this.storage.get(rootKey)
    if (!rootValue) return false

    const parentPath = pathParts.slice(0, -1).join('.')
    const lastKey = pathParts[pathParts.length - 1]
    const parent = parentPath ? getValueByPath(rootValue, parentPath) : rootValue

    if (!parent || !(lastKey in parent)) return false

    delete parent[lastKey]
    this.storage.set(rootKey, rootValue)
    return true
  }

  protected async doClear(): Promise<void> {
    this.storage.clear()
  }

  protected async doKeys(): Promise<string[]> {
    return Array.from(this.storage.keys())
  }

  protected async doHas(key: string): Promise<boolean> {
    const [rootKey, ...pathParts] = key.split('.')

    if (!pathParts.length) {
      return this.storage.has(rootKey)
    }

    const rootValue = this.storage.get(rootKey)
    if (!rootValue) return false

    const value = getValueByPath(rootValue, pathParts.join('.'))
    return value !== undefined
  }

  protected async doDestroy(): Promise<void> {
    this.storage.clear()
  }
}

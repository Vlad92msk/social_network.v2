import { getValueByPath, parsePath, setValueByPath } from './path.utils'
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
  }

  async initialize(): Promise<this> {
    try {
      this.initializeMiddlewares()
      await this.initializeWithMiddlewares()
      return this
    } catch (error) {
      this.logger?.error('Error initializing MemoryStorage', { error })
      throw error
    }
  }


  protected async doGet(key: string): Promise<any> {
    const state = this.storage.get(this.name)
    if (!state) return undefined

    return getValueByPath(state, key)
  }

  protected async doSet(key: string, value: any): Promise<void> {
    const state = this.storage.get(this.name) || {}
    const newState = setValueByPath({ ...state }, key, value)
    this.storage.set(this.name, newState)
  }

  protected async handleExternalSet(key: string, value: any): Promise<void> {
    await this.doSet(key, value)
  }

  protected async handleExternalDelete(key: string): Promise<void> {
    await this.doDelete(key)
  }

  protected async handleExternalClear(): Promise<void> {
    await this.doClear()
  }

  protected async doDelete(key: string): Promise<boolean> {
    const state = this.storage.get(this.name)
    if (!state) return false

    const pathParts = parsePath(key)
    const parentPath = pathParts.slice(0, -1).join('.')
    const lastKey = pathParts[pathParts.length - 1]
    const parent = parentPath ? getValueByPath(state, parentPath) : state

    if (!parent || !(lastKey in parent)) return false

    delete parent[lastKey]
    this.storage.set(this.name, state)
    return true
  }

  protected async doClear(): Promise<void> {
    this.storage.delete(this.name)
  }

  protected async doKeys(): Promise<string[]> {
    const state = this.storage.get(this.name)
    if (!state) return []
    return this.getAllKeys(state)
  }

  protected async doHas(key: string): Promise<boolean> {
    const value = await this.doGet(key)
    return value !== undefined
  }

  protected async doDestroy(): Promise<void> {
    this.storage.delete(this.name)
  }

  private getAllKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = []

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys = keys.concat(this.getAllKeys(obj[key], fullKey))
        } else {
          keys.push(fullKey)
        }
      }
    }

    return keys
  }
}

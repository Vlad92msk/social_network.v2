import { getValueByPath, parsePath, setValueByPath } from './path.utils'
import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import { IEventEmitter, ILogger, StorageConfig } from '../storage.interface'
import { BaseStorage } from './base-storage.service'

export class LocalStorage<T extends Record<string, any>> extends BaseStorage<T> {
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
      await this.initializeWithMiddlewares()
      return this
    } catch (error) {
      this.logger?.error('Error initializing LocalStorage', { error })
      throw error
    }
  }

  protected async doGet(key: string): Promise<any> {
    const storageData = localStorage.getItem(this.name)
    if (!storageData) return undefined

    const state = JSON.parse(storageData)
    return getValueByPath(state, key)
  }

  protected async doSet(key: string, value: any): Promise<void> {
    const storageData = localStorage.getItem(this.name)
    const state = storageData ? JSON.parse(storageData) : {}

    const newState = setValueByPath({ ...state }, key, value)
    localStorage.setItem(this.name, JSON.stringify(newState))
  }

  protected async doDelete(key: string): Promise<boolean> {
    const storageData = localStorage.getItem(this.name)
    if (!storageData) return false

    const state = JSON.parse(storageData)
    const pathParts = parsePath(key)
    const parentPath = pathParts.slice(0, -1).join('.')
    const lastKey = pathParts[pathParts.length - 1]

    const parent = parentPath ? getValueByPath(state, parentPath) : state

    if (!parent || !(lastKey in parent)) return false

    delete parent[lastKey]
    localStorage.setItem(this.name, JSON.stringify(state))
    return true
  }

  protected async doClear(): Promise<void> {
    localStorage.removeItem(this.name)
  }

  protected async doKeys(): Promise<string[]> {
    const storageData = localStorage.getItem(this.name)
    if (!storageData) return []

    const state = JSON.parse(storageData)
    return this.getAllKeys(state)
  }

  protected async doHas(key: string): Promise<boolean> {
    const value = await this.doGet(key)
    return value !== undefined
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

  protected async doDestroy(): Promise<void> {
    await this.doClear()
  }
}

import { getValueByPath, setValueByPath } from '@ui/modules/synapse/services/storage/adapters/path.utils'
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
    const [rootKey, ...pathParts] = key.split('.')
    const rootValue = localStorage.getItem(rootKey)

    if (!rootValue) return undefined

    const parsedValue = JSON.parse(rootValue)

    if (!pathParts.length) {
      return parsedValue
    }

    return getValueByPath(parsedValue, pathParts.join('.'))
  }


  protected async doSet(key: string, value: any): Promise<void> {
    const [rootKey, ...pathParts] = key.split('.')

    if (!pathParts.length) {
      localStorage.setItem(rootKey, JSON.stringify(value))
      return
    }

    const rootValue = localStorage.getItem(rootKey)
    const parsedValue = rootValue ? JSON.parse(rootValue) : {}
    const newValue = setValueByPath({ ...parsedValue }, pathParts.join('.'), value)
    localStorage.setItem(rootKey, JSON.stringify(newValue))
  }

  protected async doDelete(key: string): Promise<boolean> {
    const [rootKey, ...pathParts] = key.split('.')

    if (!pathParts.length) {
      const exists = localStorage.getItem(rootKey) !== null
      localStorage.removeItem(rootKey)
      return exists
    }

    const rootValue = localStorage.getItem(rootKey)
    if (!rootValue) return false

    const parsedValue = JSON.parse(rootValue)
    const parentPath = pathParts.slice(0, -1).join('.')
    const lastKey = pathParts[pathParts.length - 1]
    const parent = parentPath ? getValueByPath(parsedValue, parentPath) : parsedValue

    if (!parent || !(lastKey in parent)) return false

    delete parent[lastKey]
    localStorage.setItem(rootKey, JSON.stringify(parsedValue))
    return true
  }

  protected async doClear(): Promise<void> {
    localStorage.clear()
  }

  protected async doKeys(): Promise<string[]> {
    return Object.keys(localStorage)
  }

  protected async doHas(key: string): Promise<boolean> {
    const [rootKey, ...pathParts] = key.split('.')

    if (!pathParts.length) {
      return localStorage.getItem(rootKey) !== null
    }

    const rootValue = localStorage.getItem(rootKey)
    if (!rootValue) return false

    const parsedValue = JSON.parse(rootValue)
    const value = getValueByPath(parsedValue, pathParts.join('.'))
    return value !== undefined
  }

  protected async doDestroy(): Promise<void> {
    // Специфичной очистки не требуется
  }
}

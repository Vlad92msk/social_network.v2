import { getValueByPath, setValueByPath } from '@ui/modules/synapse/services/storage/adapters/path.utils'
import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import { IEventEmitter, ILogger, StorageConfig } from '../storage.interface'
import { BaseStorage } from './base-storage.service'

export interface IndexedDBConfig {
  dbName?: string
  dbVersion?: number
  storeName?: string
}

export class IndexedDBStorage extends BaseStorage {
  private initPromise: Promise<void> | null = null

  private db: IDBDatabase | null = null

  private readonly DB_NAME: string

  private readonly STORE_NAME: string

  private readonly DB_VERSION: number

  constructor(
    config: StorageConfig & { options?: IndexedDBConfig },
    pluginExecutor?: IPluginExecutor,
    eventEmitter?: IEventEmitter,
    logger?: ILogger,
  ) {
    super(config, pluginExecutor, eventEmitter, logger)

    const options = config.options as IndexedDBConfig
    this.DB_NAME = options?.dbName || 'app_storage'
    this.STORE_NAME = options?.storeName || 'keyValueStore'
    this.DB_VERSION = options?.dbVersion || 1

    // Инициализируем начальное состояние
    if (config.initialState) {
      this.initializeState(config.initialState)
    }
  }

  private async initializeState(initialState: Record<string, any>) {
    await this.ensureInitialized()

    // Проверяем, есть ли уже данные
    const existingState = await this.doGet(this.name)

    // Устанавливаем initialState только если нет существующих данных
    if (!existingState && initialState) {
      await this.doSet(this.name, initialState)
    }
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        this.logger?.error('Failed to open IndexedDB', { error: request.error })
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME)
        }
      }
    })
  }

  private async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.initDB()
    }
    return this.initPromise
  }

  private async transaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.ensureInitialized()
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db.transaction(this.STORE_NAME, mode).objectStore(this.STORE_NAME)
  }

  protected async doGet(key: string): Promise<any> {
    const [rootKey, ...pathParts] = key.split('.')
    const store = await this.transaction()

    return new Promise((resolve, reject) => {
      const request = store.get(rootKey)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const rootValue = request.result

        if (rootValue === undefined) {
          resolve(undefined)
          return
        }

        if (!pathParts.length) {
          resolve(rootValue)
          return
        }

        resolve(getValueByPath(rootValue, pathParts.join('.')))
      }
    })
  }

  protected async doSet(key: string, value: any): Promise<void> {
    const [rootKey, ...pathParts] = key.split('.')
    const store = await this.transaction('readwrite')

    return new Promise((resolve, reject) => {
      if (!pathParts.length) {
        const request = store.put(value, rootKey)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
        return
      }

      // Сначала получаем текущее значение
      const getRequest = store.get(rootKey)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const rootValue = getRequest.result || {}
        const newValue = setValueByPath({ ...rootValue }, pathParts.join('.'), value)

        const putRequest = store.put(newValue, rootKey)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      }
    })
  }

  protected async doDelete(key: string): Promise<boolean> {
    const [rootKey, ...pathParts] = key.split('.')
    const store = await this.transaction('readwrite')

    return new Promise((resolve, reject) => {
      if (!pathParts.length) {
        const request = store.delete(rootKey)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
        return
      }

      const getRequest = store.get(rootKey)
      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const rootValue = getRequest.result
        if (!rootValue) {
          resolve(false)
          return
        }

        const parentPath = pathParts.slice(0, -1).join('.')
        const lastKey = pathParts[pathParts.length - 1]
        const parent = parentPath ? getValueByPath(rootValue, parentPath) : rootValue

        if (!parent || !(lastKey in parent)) {
          resolve(false)
          return
        }

        delete parent[lastKey]
        const putRequest = store.put(rootValue, rootKey)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve(true)
      }
    })
  }

  protected async doClear(): Promise<void> {
    const store = await this.transaction('readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  protected async doKeys(): Promise<string[]> {
    const store = await this.transaction()
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys()
      request.onsuccess = () => resolve(Array.from(request.result as string[]))
      request.onerror = () => reject(request.error)
    })
  }

  protected async doHas(key: string): Promise<boolean> {
    const [rootKey, ...pathParts] = key.split('.')
    const store = await this.transaction()

    return new Promise((resolve, reject) => {
      const request = store.get(rootKey)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const rootValue = request.result
        if (!rootValue) {
          resolve(false)
          return
        }

        if (!pathParts.length) {
          resolve(true)
          return
        }

        const value = getValueByPath(rootValue, pathParts.join('.'))
        resolve(value !== undefined)
      }
    })
  }

  protected async doDestroy(): Promise<void> {
    await this.close()
    await this.deleteDatabase()
  }

  private async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.DB_NAME)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }
}

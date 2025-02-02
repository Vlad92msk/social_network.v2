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
    const store = await this.transaction()
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  protected async doSet(key: string, value: any): Promise<void> {
    const store = await this.transaction('readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(value, key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  protected async doDelete(key: string): Promise<boolean> {
    const exists = await this.doHas(key)
    const store = await this.transaction('readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve(exists)
      request.onerror = () => reject(request.error)
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
    const store = await this.transaction()
    return new Promise((resolve, reject) => {
      const request = store.count(key)
      request.onsuccess = () => resolve(request.result > 0)
      request.onerror = () => reject(request.error)
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

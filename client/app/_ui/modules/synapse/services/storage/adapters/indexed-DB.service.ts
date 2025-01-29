import type { StorageDependencies } from '../storage.interface'
import { BaseStorage } from './base-storage.service'

export class IndexedDBStorage extends BaseStorage {
  private initPromise: Promise<void> | null = null

  private db: IDBDatabase | null = null

  private readonly DB_NAME: string

  private readonly STORE_NAME: string

  private readonly DB_VERSION: number

  constructor(params: StorageDependencies) {
    super(params)

    this.DB_NAME = params.config.options?.dbName || 'app_storage'
    this.STORE_NAME = params.config.options?.storeName || 'keyValueStore'
    this.DB_VERSION = params.config.options?.dbVersion || 1
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)

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

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB()
    }
    return this.db!
  }

  private async transaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.initDB()
    }
    return this.db!.transaction(this.STORE_NAME, mode).objectStore(this.STORE_NAME)
  }

  private async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.initDB()
    }
    return this.initPromise
  }

  protected async doSet(key: string, value: any): Promise<void> {
    await this.ensureInitialized()
    const store = await this.transaction('readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(value, key)
      request.onsuccess = () => {
        resolve()
      }
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  protected async doGet(key: string): Promise<any> {
    await this.ensureInitialized()
    const store = await this.transaction()
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => {
        resolve(request.result)
      }
      request.onerror = () => {
        reject(request.error)
      }
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

  // Дополнительные методы для IndexedDB
  private async deleteDatabase(): Promise<void> {
    await this.close()
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.DB_NAME)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  protected async doDestroy(): Promise<void> {
    await this.close()
  }

  // Закрывает соединение с БД
  private async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

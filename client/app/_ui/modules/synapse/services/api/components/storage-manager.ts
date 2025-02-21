import { IndexedDBStorage } from '../../storage/adapters/indexed-DB.service'
import { LocalStorage } from '../../storage/adapters/local-storage.service'
import { MemoryStorage } from '../../storage/adapters/memory-storage.service'
import { IStorage, StorageType } from '../../storage/storage.interface'
import { StorageKeyType } from '../../storage/utils/storage-key'
import { Unsubscribe } from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'

// 1. StorageManager.ts - управление хранилищем
export class StorageManager {
  private storagePromise: Promise<IStorage>

  private storage: IStorage | null = null


  constructor(private storageType: StorageType, private options?: any) {
    this.storagePromise = this.initializeStorage()
  }

  public async initialize(): Promise<IStorage> {
    this.storage = await this.storagePromise
    return this.storage
  }

  public getStorage(): IStorage | null {
    return this.storage
  }

  public async waitForStorage(): Promise<IStorage> {
    return this.storagePromise
  }

  private initializeStorage(): Promise<IStorage> {
    const { storageType, options } = this
    // Создаем имя хранилища
    const name = options?.name || 'api-module'

    try {
      // Выбираем тип хранилища
      switch (storageType) {
        case 'indexedDB':
          return new IndexedDBStorage({
            name,
            options: {
              dbName: options?.dbName || 'api-cache',
              storeName: options?.storeName || 'requests',
              dbVersion: options?.dbVersion || 1,
            },
          }).initialize()

        case 'localStorage':
          return new LocalStorage({ name }).initialize()

        case 'memory':
        default:
          return new MemoryStorage({ name }).initialize()
      }
    } catch (error) {
      apiLogger.error('Ошибка инициализации хранилища', error)
      // Возвращаем хранилище в памяти как запасной вариант
      return new MemoryStorage({ name: `${name}-fallback` }).initialize()
    }
  }

  public async set<T>(key: StorageKeyType, value: T): Promise<void> {
    if (!this.storage) throw new Error('Хранилище не инициализировано')
    return this.storage.set(key, value)
  }

  public async get<T>(key: StorageKeyType): Promise<T | null> {
    if (!this.storage) return null
    //@ts-ignore
    return this.storage.get<T>(key)
  }

  public async delete(key: StorageKeyType): Promise<void> {
    if (!this.storage) return
    //@ts-ignore
    return this.storage.delete(key)
  }

  public async keys(): Promise<StorageKeyType[]> {
    if (!this.storage) return []
    return this.storage.keys()
  }

  public subscribe<T>(key: string, callback: (value: T) => void): Unsubscribe {
    if (!this.storage) return () => {}
    return this.storage.subscribe(key, callback)
  }
}

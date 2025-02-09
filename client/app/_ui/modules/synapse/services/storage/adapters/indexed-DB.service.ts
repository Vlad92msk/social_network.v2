import { getValueByPath, parsePath, setValueByPath } from './path.utils'
import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'
import { IEventEmitter, ILogger, StorageConfig } from '../storage.interface'
import { BaseStorage } from './base-storage.service'

export interface IndexedDBConfig {
  dbName?: string
  dbVersion?: number
  storeName?: string
}

export class IndexedDBStorage<T extends Record<string, any>> extends BaseStorage<T> {
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
  }

  async initialize(): Promise<this> {
    try {
      // Сначала инициализируем БД
      await this.ensureInitialized()
      this.initializeMiddlewares()
      // Затем инициализируем данные через middleware
      await this.initializeWithMiddlewares()
      return this
    } catch (error) {
      this.logger?.error('Error initializing IndexedDB storage', { error })
      throw error
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
    console.log('doGet_key', key)
    // Если ключ пустой - возвращаем все содержимое хранилища
    if (key === '') {
      const store = await this.transaction()
      return new Promise((resolve, reject) => {
        // Получаем отдельно ключи
        const keysRequest = store.getAllKeys()
        // Получаем отдельно значения
        const valuesRequest = store.getAll()

        let keys: IDBValidKey[] = []
        let values: any[] = []

        keysRequest.onsuccess = () => {
          keys = keysRequest.result
        }

        valuesRequest.onsuccess = () => {
          values = valuesRequest.result
          // Собираем объект
          const result = {}
          keys.forEach((key, index) => {
            if (typeof key === 'string') {
              result[key] = values[index]
            }
          })
          resolve(result)
        }

        keysRequest.onerror = () => reject(keysRequest.error)
        valuesRequest.onerror = () => reject(valuesRequest.error)
      })
    }

    const store = await this.transaction()
    const parts = parsePath(key)
    const rootKey = parts[0]

    return new Promise((resolve, reject) => {
      const request = store.get(rootKey)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const value = request.result
        if (value === undefined) {
          resolve(undefined)
          return
        }

        if (parts.length === 1) {
          resolve(value)
          return
        }

        // Получаем значение по вложенному пути, если он есть
        resolve(getValueByPath(value, parts.slice(1).join('.')))
      }
    })
  }

  protected async doSet(key: string, value: any): Promise<void> {
    const store = await this.transaction('readwrite')

    // Если ключ пустой и значение является объектом
    if (key === '' && typeof value === 'object') {
      const entries = Object.entries(value)

      // Группируем по корневым ключам для минимизации операций
      const rootUpdates = new Map<string, any>()

      for (const [entryKey, entryValue] of entries) {
        const parts = parsePath(entryKey)
        const rootKey = parts[0]

        if (parts.length === 1) {
          rootUpdates.set(rootKey, entryValue)
        } else {
          if (!rootUpdates.has(rootKey)) {
            const currentValue = await this.getValueFromStore(store, rootKey)
            rootUpdates.set(rootKey, currentValue || {})
          }

          const updatedValue = setValueByPath(
            { ...rootUpdates.get(rootKey) },
            parts.slice(1).join('.'),
            entryValue,
          )
          rootUpdates.set(rootKey, updatedValue)
        }
      }

      // Применяем все обновления в одной транзакции
      await Promise.all(
        Array.from(rootUpdates.entries()).map(([rootKey, rootValue]) => this.putValueInStore(store, rootKey, rootValue)),
      )
      return
    }

    // Обычная установка значения
    const parts = parsePath(key)
    const rootKey = parts[0]

    if (parts.length === 1) {
      await this.putValueInStore(store, rootKey, value)
      return
    }

    // Обновление вложенного пути
    const rootValue = await this.getValueFromStore(store, rootKey) || {}
    const newValue = setValueByPath(
      { ...rootValue },
      parts.slice(1).join('.'),
      value,
    )

    await this.putValueInStore(store, rootKey, newValue)
  }

  protected async doUpdate(updates: Array<{ key: string; value: any }>): Promise<void> {
    const store = await this.transaction('readwrite')
    const tx = store.transaction

    try {
      // Группируем обновления по корневым ключам
      const rootUpdates = new Map<string, any>()

      // Собираем все обновления сначала
      for (const { key, value } of updates) {
        const parts = parsePath(key)
        const rootKey = parts[0]

        if (parts.length === 1) {
          rootUpdates.set(rootKey, value)
        } else {
          // Загружаем текущее значение только если еще не загрузили
          if (!rootUpdates.has(rootKey)) {
            const currentValue = await this.getValueFromStore(store, rootKey)
            rootUpdates.set(rootKey, currentValue || {})
          }

          const updatedValue = setValueByPath(
            { ...rootUpdates.get(rootKey) },
            parts.slice(1).join('.'),
            value,
          )
          rootUpdates.set(rootKey, updatedValue)
        }
      }

      // Выполняем операции записи в рамках одной транзакции
      const updatePromises = Array.from(rootUpdates.entries()).map(
        ([rootKey, value]) => this.putValueInStore(store, rootKey, value),
      )

      // Дожидаемся завершения всех операций и транзакции
      await Promise.all([
        Promise.all(updatePromises),
        new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        }),
      ])

      console.log('хранилище обновлено')
    } catch (error) {
      console.error('Ошибка при обновлении:', error)
      throw error
    }
  }

  private async getValueFromStore(store: IDBObjectStore, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  private async putValueInStore(store: IDBObjectStore, key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.put(value, key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  protected async doDelete(key: string): Promise<boolean> {
    const store = await this.transaction('readwrite')
    const parts = parsePath(key)
    const rootKey = parts[0]

    return new Promise((resolve, reject) => {
      if (parts.length === 1) {
        // Если путь состоит из одного сегмента - удаляем ключ
        const request = store.delete(rootKey)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
        return
      }

      // Если путь вложенный - получаем и обновляем объект
      const getRequest = store.get(rootKey)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const rootValue = getRequest.result
        if (!rootValue) {
          resolve(false)
          return
        }

        const pathToDelete = parts.slice(1).join('.')
        const parentPath = pathToDelete.split('.').slice(0, -1).join('.')
        const lastKey = parts[parts.length - 1]
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
      request.onsuccess = () => {
        // Получаем все ключи и их вложенные пути
        Promise.all(
          Array.from(request.result as string[]).map(async (key) => {
            const value = await this.doGet(key)
            return this.getAllKeys(value, key)
          }),
        ).then((keyArrays) => {
          resolve(keyArrays.flat())
        }).catch(reject)
      }
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

  protected async doHas(key: string): Promise<boolean> {
    const value = await this.doGet(key)
    return value !== undefined
  }

  private getAllKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = []

    if (typeof obj !== 'object' || obj === null) {
      return [prefix]
    }

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

  private async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }
}

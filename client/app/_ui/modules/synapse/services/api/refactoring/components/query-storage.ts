import { IndexedDBStorage } from '../../../storage/adapters/indexed-DB.service'
import { LocalStorage } from '../../../storage/adapters/local-storage.service'
import { MemoryStorage } from '../../../storage/adapters/memory-storage.service'
import { IStorage, StorageType } from '../../../storage/storage.interface'

/**
 * Менеджер хранилища для API
 */
export class QueryStorage {
  /** Экземпляр хранилища */
  private storage: IStorage | null = null

  /** Промис инициализации */
  private initPromise: Promise<IStorage> | null = null

  /**
   * Создает новый экземпляр менеджера хранилища
   * @param storageType Тип хранилища
   * @param options Опции для хранилища
   */
  constructor(
    private storageType: StorageType = 'localStorage',
    private options: Record<string, any> = {},
  ) {}

  /**
   * Инициализирует хранилище
   * @returns Промис с инициализированным хранилищем
   */
  public initialize() {
    // Если инициализация уже запущена, возвращаем существующий промис
    if (this.initPromise) {
      return this.initPromise
    }

    // Создаем и сохраняем промис инициализации
    this.initPromise = this.createStorage()
    return this.initPromise
  }

  /**
   * Создает хранилище в зависимости от типа
   * @returns Промис с созданным хранилищем
   */
  private async createStorage() {
    try {
      const name = this.options.name || 'api-storage'

      switch (this.storageType) {
        case 'indexedDB':
          this.storage = new IndexedDBStorage({
            name,
            options: {
              dbName: this.options?.dbName || 'api-cache',
              storeName: this.options?.storeName || 'requests',
              dbVersion: this.options?.dbVersion || 1,
            },
          })
          break

        case 'localStorage':
          this.storage = new LocalStorage({ name })
          break

        case 'memory':
        default:
          this.storage = new MemoryStorage({ name })
      }

      // Инициализируем хранилище
      await this.storage.initialize()

      return this.storage
    } catch (error) {
      console.error(`Ошибка инициализации хранилища (${this.storageType}):`, error)

      // В случае ошибки с IndexedDB, пробуем использовать localStorage как запасной вариант
      if (this.storageType === 'indexedDB') {
        console.warn('Переключение на localStorage в качестве резервного хранилища')
        this.storage = new LocalStorage({
          name: this.options.name || 'api-storage',
        })
        await this.storage.initialize()
        return this.storage
      }

      throw error
    }
  }

  /**
   * Получает экземпляр хранилища
   * @returns Экземпляр хранилища или null
   */
  public getStorage() {
    return this.storage
  }

  /**
   * Проверяет, инициализировано ли хранилище
   * @returns true если хранилище инициализировано
   */
  public isInitialized() {
    return this.storage !== null
  }
}

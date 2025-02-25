import { IStorage, StorageType } from '../../../storage/storage.interface'

/**
 * Менеджер хранилища для API
 */
export class StorageManager {
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
    private storageType: StorageType,
    private options: Record<string, any> = {},
  ) {}

  /**
   * Инициализирует хранилище
   * @returns Промис с инициализированным хранилищем
   */
  public initialize(): Promise<IStorage> {
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
  private async createStorage(): Promise<IStorage> {
    try {
      switch (this.storageType) {
        case 'localStorage':
          this.storage = new LocalStorage(this.options)
          break
        // case 'sessionStorage':
        //   this.storage = new SessionStorageAdapter(this.options)
        //   break
        case 'indexedDB':
          this.storage = new IndexedDBStorage({
            dbName: this.options.dbName || 'api-storage',
            storeName: this.options.storeName || 'requests',
            dbVersion: this.options.dbVersion || 1,
            ...this.options,
          })
          break
        default:
          this.storage = new LocalStorage(this.options)
          break
      }

      // Инициализируем хранилище
      await this.storage.initialize()

      return this.storage
    } catch (error) {
      console.error(`Ошибка инициализации хранилища (${this.storageType}):`, error)

      // В случае ошибки с IndexedDB, пробуем использовать localStorage как запасной вариант
      if (this.storageType === 'indexedDB') {
        console.warn('Переключение на localStorage в качестве резервного хранилища')
        this.storage = new LocalStorage(this.options)
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
  public getStorage(): IStorage | null {
    return this.storage
  }

  /**
   * Проверяет, инициализировано ли хранилище
   * @returns true если хранилище инициализировано
   */
  public isInitialized(): boolean {
    return this.storage !== null
  }
}

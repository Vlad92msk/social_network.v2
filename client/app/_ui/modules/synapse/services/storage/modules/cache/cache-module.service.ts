import { createCacheMiddleware } from './create-cache.middleware'
import { IStorage, StorageConfig } from '../../storage.interface'
import { IPluginExecutor } from '../plugin-manager/plugin-managers.interface'

type Constructor<T> = {
  new (...args: any[]): T;
};

// Типы для кэширования
export interface CacheMetadata {
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  accessCount: number;
}

export interface CacheOptions {
  // Время жизни кэша
  ttl?: number;
  // Настройки очистки
  cleanup?: {
    // Автоматическая очистка устаревших данных
    enabled: boolean;
    // Интервал очистки
    interval?: number;
  }
}

export interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata
}

export interface CacheConfig<T extends IStorage = IStorage> {
  storage: Constructor<T>
  storageConfig: StorageConfig & { options?: any }
  pluginExecutor?: IPluginExecutor
  cacheOptions: CacheOptions
}

export class CacheModule implements IStorage {
  private storage: IStorage

  private cleanupInterval?: ReturnType<typeof setInterval>

  constructor(private readonly config: CacheConfig) {
    const middlewares = config.storageConfig.middlewares
      || ((defaultMiddleware) => defaultMiddleware({ shallowCompare: false }))

    this.storage = new config.storage({
      ...config.storageConfig,
      middlewares: (getDefaultMiddleware) => [
        ...middlewares(getDefaultMiddleware),
        createCacheMiddleware({
          ttl: config.cacheOptions.ttl || 0,
          cleanup: config.cacheOptions.cleanup,
        }),
      ],
    }, config.pluginExecutor)

    this.initCleanup()
  }

  private initCleanup() {
    if (this.config.cacheOptions.cleanup?.enabled
      && this.config.cacheOptions.cleanup.interval) {
      this.cleanupInterval = setInterval(
        () => this.clearExpired(),
        this.config.cacheOptions.cleanup.interval,
      )
    }
  }

  // Публичный метод для проверки валидности кэша
  async isValid(key: string): Promise<boolean> {
    const entry = await this.storage.get<CacheEntry<unknown>>(key)
    return entry ? Date.now() <= entry.metadata.expiresAt : false
  }

  // Публичный метод для получения метаданных
  async getMetadata(key: string): Promise<CacheMetadata | undefined> {
    const entry = await this.storage.get<CacheEntry<unknown>>(key)
    return entry?.metadata
  }

  // Публичный метод для очистки устаревших данных
  async clearExpired(): Promise<void> {
    const keys = await this.storage.keys()
    for (const key of keys) {
      const entry = await this.storage.get<CacheEntry<unknown>>(key)
      if (entry && entry.metadata.expiresAt < Date.now()) {
        await this.storage.delete(key)
      }
    }
  }

  get name(): string {
    return this.storage.name
  }

  // Базовые операции просто делегируются хранилищу,
  // вся логика кэширования уже обработана в middleware
  async get<T>(key: string): Promise<T | undefined> {
    return this.storage.get(key)
  }

  async getState(): Promise<Record<string, any>> {
    return this.storage.getState()
  }

  async set<T>(key: string, value: T): Promise<void> {
    console.log('key', key)
    console.log('value', value)
    return this.storage.set(key, value)
  }

  async delete(key: string): Promise<void> {
    return this.storage.delete(key)
  }

  async clear(): Promise<void> {
    return this.storage.clear()
  }

  async keys(): Promise<string[]> {
    return this.storage.keys()
  }

  async has(key: string): Promise<boolean> {
    return this.storage.has(key)
  }

  subscribeToAll(callback: (event: { type: string, key?: string, value?: any }) => void): VoidFunction {
    return this.storage.subscribeToAll(callback)
  }

  subscribe(key: string, callback: (value: any) => void): () => void {
    return this.storage.subscribe(key, callback)
  }

  // Один метод destroy вместо двух
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    await this.storage.destroy()
  }

  // Добавляем удобные статические методы для работы с ключами
  static createKey(...parts: (string | number)[]): string {
    return parts.join('_')
  }

  static createApiKey(endpoint: string, params?: Record<string, any>): string {
    if (!params) return `api_${endpoint}`
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    return `api_${endpoint}_${sortedParams}`
  }
}

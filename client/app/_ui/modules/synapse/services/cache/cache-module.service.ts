export interface CacheStorage {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
  subscribe(key: string, callback: (value: any) => void): () => void
}

export interface CacheConfig {
  storage: CacheStorage
  ttl?: number
  staleData?: {
    returnStale: boolean
    autoClean: boolean
    cleanupInterval?: number
  }
}

interface CacheMetadata {
  createdAt: number
  updatedAt: number
  expiresAt: number
  accessCount: number
}

interface CacheEntry<T> {
  data: T
  metadata: CacheMetadata
}

interface CacheStats {
  totalEntries: number
  expiredEntries: number
  averageAccessCount: number
}

export class CacheModule {
  private readonly storage: CacheStorage

  private readonly config: CacheConfig

  private cleanupInterval?: NodeJS.Timeout

  constructor(config: CacheConfig) {
    this.storage = config.storage
    this.config = config

    this.initCleanup()
    this.init()
  }

  private async init() {
    try {
      await this.clearExpired()
    } catch (error) {
      // Можно добавить обработку ошибки если нужно
      console.error('Failed to clear expired items during initialization:', error)
    }
  }

  private initCleanup(): void {
    if (this.config.staleData?.autoClean && this.config.staleData.cleanupInterval) {
      this.cleanupInterval = setInterval(async () => {
        try {
          await this.clearExpired()
        } catch (error) {
          console.error('Failed to clear expired items:', error)
        }
      }, this.config.staleData.cleanupInterval)
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = await this.storage.get<CacheEntry<T>>(key)

    if (!entry) return undefined

    const now = Date.now()

    // Проверяем не истекли ли данные
    if (now > entry.metadata.expiresAt) {
      if (!this.config.staleData?.returnStale) {
        await this.delete(key)
        return undefined
      }
    }

    // Обновляем метаданные доступа
    entry.metadata.accessCount++
    await this.storage.set(key, {
      ...entry,
      metadata: {
        ...entry.metadata,
        accessCount: entry.metadata.accessCount,
      },
    })

    return entry.data
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now()

    const entry: CacheEntry<T> = {
      data,
      metadata: {
        createdAt: now,
        updatedAt: now,
        expiresAt: now + (ttl ?? this.config.ttl ?? 0),
        accessCount: 0,
      },
    }

    await this.storage.set(key, entry)
  }

  async getMany<T>(keys: string[]): Promise<Array<T | undefined>> {
    return Promise.all(keys.map((key) => this.get<T>(key)))
  }

  async setMany<T>(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    await Promise.all(entries.map((entry) => this.set(entry.key, entry.data, entry.ttl)))
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(key)
  }

  async clear(): Promise<void> {
    await this.storage.clear()
  }

  async has(key: string): Promise<boolean> {
    const entry = await this.storage.get<CacheEntry<any>>(key)

    if (!entry) return false

    // Проверяем не истекли ли данные
    return Date.now() <= entry.metadata.expiresAt
  }

  async clearExpired(): Promise<void> {
    const now = Date.now()
    const keys = await this.storage.keys()

    const expiredKeys = await Promise.all(
      keys.map(async (key) => {
        const entry = await this.storage.get<CacheEntry<any>>(key)
        return entry && entry.metadata.expiresAt < now ? key : null
      }),
    )

    await Promise.all(
      expiredKeys
        .filter((key): key is string => key !== null)
        .map((key) => this.delete(key)),
    )
  }

  async getMetadata(key: string): Promise<CacheMetadata | undefined> {
    const entry = await this.storage.get<CacheEntry<any>>(key)
    return entry?.metadata
  }

  async getStats(): Promise<CacheStats> {
    const keys = await this.storage.keys()
    const entries = await Promise.all(
      keys.map((key) => this.storage.get<CacheEntry<any>>(key)),
    )

    const validEntries = entries.filter((entry): entry is CacheEntry<any> => entry !== undefined && entry.metadata.expiresAt > Date.now())

    return {
      totalEntries: entries.length,
      expiredEntries: entries.length - validEntries.length,
      averageAccessCount: validEntries.reduce((sum, entry) => sum + entry.metadata.accessCount, 0) / validEntries.length || 0,
    }
  }

  subscribe(key: string, callback: (value: any) => void): () => void {
    return this.storage.subscribe(key, callback)
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

import { IndexedDBStorage } from '@ui/modules/synapse/services/storage/indexed-DB.service'
import { LocalStorage } from '@ui/modules/synapse/services/storage/local-storage.service'
import { MemoryStorage } from './memory-storage.service'
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { dataUtils, pathUtils } from './storage.utils'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import { Middleware } from '../core/core.interface'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import type { Event, IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  private subscribers = new Map<string, Set<(value: any) => void>>()

  private selectors = new Map<string, (state: any) => any>()

  constructor(
    container: IDIContainer,
    @Inject('STORAGE_CONFIG') private readonly config: IStorageConfig,
  ) {
    super(container)
    if (!config) throw new Error('StorageConfig is required')
  }

  static create(config: IStorageConfig, parentContainer?: IDIContainer): StorageModule {
    const container = new DIContainer({ parent: parentContainer })
    container.register({ id: 'STORAGE_CONFIG', instance: config })
    return container.resolve(StorageModule)
  }

  protected async registerServices(): Promise<void> {
    const pluginManager = this.container.resolve(StoragePluginManager)

    if (this.config.plugins) {
      for (const plugin of this.config.plugins) {
        await pluginManager.add(plugin)
      }
    }

    const storage = await this.createStorage()
    this.container.register({ id: 'pluginManager', instance: pluginManager })
    this.container.register({ id: 'storage', instance: storage })

    if (this.config.initialState) {
      await this.initializeState(this.config.initialState)
    }
  }

  private async initializeState(initialState: Record<string, any>): Promise<void> {
    const storage = this.getStorage()
    const flatState = dataUtils.flatten(initialState)

    for (const [key, value] of Object.entries(flatState)) {
      await storage.set(key, value)
    }
  }

  protected async setupEventHandlers(): Promise<void> {
    const eventBus = this.container.get<IEventBus>('eventBus')
    const logger = this.container.get<ILogger>('logger')

    eventBus.subscribe('storage:changed', async (event) => {
      this.notifySubscribers(event.payload.key, event.payload.value)
      logger.debug('Storage changed:', event.payload)
    })

    eventBus.subscribe('app:cleanup', async () => {
      await this.cleanupResources()
    })
  }

  private notifySubscribers(key: string, value: any): void {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach((callback) => callback(value))
    }
  }

  public createSelector<T, R>(selector: (state: T) => R): () => Promise<R> {
    const id = Math.random().toString(36).substr(2, 9)
    this.selectors.set(id, selector)

    return async () => {
      const state = await this.getState()
      return selector(state as T)
    }
  }

  public createSegment<T extends Record<string, any>>(
    config: { name: string; initialState?: T },
  ) {
    const { name, initialState } = config
    const storage = this.getStorage()

    if (initialState) {
      const flatState = dataUtils.flatten(initialState)
      Object.entries(flatState).forEach(([key, value]) => {
        storage.set(pathUtils.join(name, key), value)
      })
    }

    const getAllValues = async (): Promise<T> => {
      const storage = this.getStorage()
      const allKeys = await storage.keys()
      const segmentKeys = allKeys.filter((key) => key.startsWith(`${name}.`))
      const flatState: Record<string, any> = {}

      for (const key of segmentKeys) {
        const value = await storage.get(key)
        const pureKey = key.replace(`${name}.`, '')
        flatState[pureKey] = value
      }

      return dataUtils.unflatten(flatState) as T
    }

    return {
      // Стандартные методы
      select: async <R>(selector: (state: T) => R): Promise<R> => {
        const state = await getAllValues()
        return selector(state)
      },

      update: async (updater: (state: T) => void): Promise<void> => {
        const state = await getAllValues()
        updater(state)
        const flatState = dataUtils.flatten(state)
        for (const [key, value] of Object.entries(flatState)) {
          await storage.set(pathUtils.join(name, key), value)
        }
      },

      // Новые методы для работы с путями
      getByPath: async <R>(path: string): Promise<R | undefined> => {
        const fullPath = pathUtils.join(name, path)
        return storage.get<R>(fullPath)
      },

      setByPath: async <R>(path: string, value: R): Promise<void> => {
        const fullPath = pathUtils.join(name, path)
        await storage.set(fullPath, value)
      },

      // Частичное обновление
      patch: async (partialState: Partial<T>): Promise<void> => {
        const current = await getAllValues()
        const merged = dataUtils.merge(current, partialState)
        const flatState = dataUtils.flatten(merged)
        for (const [key, value] of Object.entries(flatState)) {
          await storage.set(pathUtils.join(name, key), value)
        }
      },

      subscribe: (listener: (state: T) => void) => {
        const callback = async () => {
          const state = await getAllValues()
          listener(state)
        }

        const segmentKeys = new Set<string>()
        this.getAllKeys()
          .then((keys) => {
            keys.forEach((key) => {
              if (key.startsWith(`${name}.`)) {
                segmentKeys.add(key)
                if (!this.subscribers.has(key)) {
                  this.subscribers.set(key, new Set())
                }
                this.subscribers.get(key)!.add(callback)
              }
            })
          })

        return () => {
          segmentKeys.forEach((key) => {
            const subscribers = this.subscribers.get(key)
            if (subscribers) {
              subscribers.delete(callback)
              if (subscribers.size === 0) {
                this.subscribers.delete(key)
              }
            }
          })
        }
      },
    }
  }

  private async getAllKeys(): Promise<string[]> {
    const storage = this.getStorage()
    return storage.keys()
  }

  protected async cleanupResources(): Promise<void> {
    const storage = this.getStorage()
    await storage.clear()
    this.subscribers.clear()
  }

  private async createStorage(): Promise<IStorage> {
    switch (this.config.type) {
      case 'localStorage':
        return this.container.resolve(LocalStorage)
      case 'indexDB':
        return this.container.resolve(IndexedDBStorage)
      case 'memory':
      default:
        return this.container.resolve(MemoryStorage)
    }
  }

  private getDefaultMiddleware(): Middleware[] {
    return [
      // Добавьте здесь дефолтные middleware
    ]
  }

  // Публичный API
  public async getState(): Promise<Record<string, any>> {
    const storage = this.getStorage()
    const keys = await storage.keys()
    const flatState: Record<string, any> = {}

    for (const key of keys) {
      const value = await storage.get(key)
      flatState[key] = value
    }

    return dataUtils.unflatten(flatState)
  }

  private getStorage(): IStorage {
    return this.container.get<IStorage>('storage')
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const storage = this.getStorage()
    return storage.get<T>(key)
  }
}

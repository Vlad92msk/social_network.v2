import { IndexedDBStorage } from './indexed-DB.service'
import { LocalStorage } from './local-storage.service'
import { MemoryStorage } from './memory-storage.service'
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig, IStorageSegment } from './storage.interface'
import { dataUtils, pathUtils } from './storage.utils'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import type { IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class StorageModule extends BaseModule {
  readonly name = 'storage'

  private subscribers = new Map<string, Set<(value: any) => void>>()

  private selectors = new Map<string, (state: any) => any>()

  private segmentStorages = new Map<string, IStorage>()

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

    // Создаем основное хранилище для данных из конфига
    const defaultStorage = await this.createStorage(this.config.type)
    this.container.register({ id: 'pluginManager', instance: pluginManager })
    this.container.register({ id: 'storage', instance: defaultStorage })

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

  public async createSegment<T extends Record<string, any>>(
    config: { name: string; initialState?: T; type?: IStorageConfig['type']; },
  ): Promise<IStorageSegment<T>> {
    const { name, initialState, type } = config
    // Создаем отдельное хранилище для сегмента, если указан тип
    let segmentStorage: IStorage
    if (type) {
      segmentStorage = await this.createStorage(type)
      this.segmentStorages.set(name, segmentStorage)
    } else {
      // Если тип не указан, используем основное хранилище
      segmentStorage = this.getStorage()
    }

    if (initialState) {
      const flatState = dataUtils.flatten(initialState)
      Object.entries(flatState).forEach(([key, value]) => {
        segmentStorage.set(pathUtils.join(name, key), value)
      })
    }

    const getAllValues = async (): Promise<T> => {
      const allKeys = await segmentStorage.keys()
      const segmentKeys = allKeys.filter((key) => key.startsWith(`${name}.`))
      const flatState: Record<string, any> = {}

      for (const key of segmentKeys) {
        const value = await segmentStorage.get(key)
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
          await segmentStorage.set(pathUtils.join(name, key), value)
        }
      },

      // Новые методы для работы с путями
      getByPath: async <R>(path: string): Promise<R | undefined> => {
        const fullPath = pathUtils.join(name, path)
        return segmentStorage.get<R>(fullPath)
      },

      setByPath: async <R>(path: string, value: R): Promise<void> => {
        const fullPath = pathUtils.join(name, path)
        await segmentStorage.set(fullPath, value)
      },

      // Частичное обновление
      patch: async (partialState: Partial<T>): Promise<void> => {
        const current = await getAllValues()
        const merged = dataUtils.merge(current, partialState)
        const flatState = dataUtils.flatten(merged)
        for (const [key, value] of Object.entries(flatState)) {
          await segmentStorage.set(pathUtils.join(name, key), value)
        }
      },

      subscribe: (listener: (state: T) => void) => {
        const callback = async () => {
          const state = await getAllValues()
          listener(state)
        }

        const segmentKeys = new Set<string>()
        segmentStorage.keys()
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

      // Добавляем метод для очистки сегмента
      clear: async (): Promise<void> => {
        const keys = await segmentStorage.keys()
        const segmentKeys = keys.filter((key) => key.startsWith(`${name}.`))
        for (const key of segmentKeys) {
          await segmentStorage.delete(key)
        }
      },
    }
  }

  private async getAllKeys(): Promise<string[]> {
    const storage = this.getStorage()
    return storage.keys()
  }

  protected async cleanupResources(): Promise<void> {
    // Очищаем все хранилища
    await this.getStorage().clear()
    for (const storage of this.segmentStorages.values()) {
      await storage.clear()
    }
    this.segmentStorages.clear()
    this.subscribers.clear()
  }

  private async createStorage(type: IStorageConfig['type']): Promise<IStorage> {
    switch (type) {
      case 'localStorage':
        return this.container.resolve(LocalStorage)
      case 'indexDB':
        return this.container.resolve(IndexedDBStorage)
      case 'memory':
      default:
        return this.container.resolve(MemoryStorage)
    }
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

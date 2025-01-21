import { StateManager } from './segment-manager.service'
import { SelectorManager } from './selector-manager.service'
import type {
  IStorage, IStorageConfig, IStorageSegment, SegmentConfig, Selector, SelectorAPI, SelectorOptions,
} from './storage.interface'
import { dataUtils, pathUtils } from './storage.utils'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'

@Injectable()
export class StorageSegmentManager extends BaseModule {
  readonly name = 'segmentManager'

  private segmentStorages = new Map<string, IStorage>()

  private segmentSubscribers = new Map<string, Set<(state: any) => void>>()

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('storage') private readonly storage: IStorage,
    @Inject('stateManager') private readonly stateManager: StateManager,
    @Inject('selectorManager') private readonly selectorManager: SelectorManager,
    @Inject('createStorage') private readonly createStorage: (type: IStorageConfig['type']) => Promise<IStorage>,
  ) {
    super(container)
  }

  protected async registerServices(): Promise<void> {
    // Нет необходимости регистрировать дополнительные сервисы
  }

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('storage', async (event) => {
      if (event.type === 'storage:changed') {
        const { key } = event.payload
        // Находим все сегменты, к которым относится измененный ключ
        for (const [segmentName, subscribers] of this.segmentSubscribers.entries()) {
          if (key.startsWith(`${segmentName}.`)) {
            await this.notifySegmentSubscribers(segmentName)
          }
        }
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    // Очищаем все сегменты и подписки
    for (const storage of this.segmentStorages.values()) {
      await storage.clear()
    }
    this.segmentStorages.clear()
    this.segmentSubscribers.clear()
  }

  // Public API
  async createSegment<T extends Record<string, any>>(
    config: SegmentConfig<T>,
  ): Promise<IStorageSegment<T>> {
    const { name, initialState, type } = config

    // Получаем или создаем хранилище для сегмента
    const segmentStorage = type
      ? await this.createSegmentStorage(type)
      : this.storage

    if (type) {
      this.segmentStorages.set(name, segmentStorage)
    }

    // Инициализируем начальное состояние если есть
    if (initialState) {
      await this.initializeSegmentState(name, initialState, segmentStorage)
    }

    return this.createSegmentAPI(name, segmentStorage)
  }

  private async createSegmentStorage(type: IStorageConfig['type']): Promise<IStorage> {
    return this.createStorage(type)
  }

  private async initializeSegmentState(
    segmentName: string,
    initialState: Record<string, any>,
    storage: IStorage,
  ): Promise<void> {
    const flatState = dataUtils.flatten(initialState)
    for (const [key, value] of Object.entries(flatState)) {
      await storage.set(pathUtils.join(segmentName, key), value)
    }
  }

  private async getSegmentState<T>(name: string, storage: IStorage): Promise<T> {
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

  private async setSegmentState(
    name: string,
    storage: IStorage,
    state: Record<string, any>,
  ): Promise<void> {
    const flatState = dataUtils.flatten(state)
    for (const [key, value] of Object.entries(flatState)) {
      const fullKey = pathUtils.join(name, key)
      await storage.set(fullKey, value)
      await this.eventBus.emit({
        type: 'storage:changed',
        payload: { key: fullKey, value },
      })
    }
  }

  private async notifySegmentSubscribers(segmentName: string): Promise<void> {
    const subscribers = this.segmentSubscribers.get(segmentName)
    if (subscribers) {
      const storage = this.segmentStorages.get(segmentName) || this.storage
      const state = await this.getSegmentState(segmentName, storage)
      subscribers.forEach((listener) => listener(state))
    }
  }

  private createSegmentAPI<T extends Record<string, any>>(name: string, storage: IStorage): IStorageSegment<T> {
    return {
      // Базовые операции с состоянием
      select: async <R>(selector: (state: T) => R): Promise<R> => {
        const state = await this.getSegmentState<T>(name, storage)
        return selector(state as T)
      },

      update: async (updater: (state: T) => void | T): Promise<void> => {
        const state = await this.getSegmentState<T>(name, storage)
        const newState = updater(state as T) ?? state
        await this.setSegmentState(name, storage, newState as Record<string, any>)
      },

      // Операции с путями
      getByPath: async <R>(path: string): Promise<R | undefined> => {
        const fullPath = pathUtils.join(name, path)
        return storage.get<R>(fullPath)
      },

      setByPath: async <R>(path: string, value: R): Promise<void> => {
        const fullPath = pathUtils.join(name, path)
        await Promise.all([
          storage.set(fullPath, value),
          this.eventBus.emit({
            type: 'storage:changed',
            payload: { key: fullPath, value },
          }),
        ])
      },

      // Частичное обновление
      patch: async (partialState: Partial<T>): Promise<void> => {
        const current = await this.getSegmentState<T>(name, storage)
        const merged = dataUtils.merge(current as Record<string, any>, partialState)
        await this.setSegmentState(name, storage, merged)
      },

      // Подписка на изменения
      subscribe: (listener: (state: T) => void): () => void => {
        if (!this.segmentSubscribers.has(name)) {
          this.segmentSubscribers.set(name, new Set())
        }
        const subscribers = this.segmentSubscribers.get(name)!
        subscribers.add(listener)

        return () => {
          const subs = this.segmentSubscribers.get(name)
          if (subs) {
            subs.delete(listener)
            if (subs.size === 0) {
              this.segmentSubscribers.delete(name)
            }
          }
        }
      },

      // Создание селектора для сегмента
      createSelector: (<R>(
        selector: Selector<T, R>,
        options?: SelectorOptions<R>,
      ): SelectorAPI<R> => {
        const segmentSelector = (globalState: Record<string, any>) => {
          const segmentState = this.extractSegmentState<T>(name, globalState)
          return selector(segmentState)
        }

        return this.selectorManager.createSelector(segmentSelector, options)
      }) as IStorageSegment<T>['createSelector'],

      // Очистка сегмента
      clear: async (): Promise<void> => {
        const keys = await storage.keys()
        const segmentKeys = keys.filter((key) => key.startsWith(`${name}.`))
        await Promise.all(segmentKeys.map((key) => storage.delete(key)))
      },
    }
  }

  private extractSegmentState<T>(name: string, globalState: any): T {
    const segmentState: Record<string, any> = {}
    const prefix = `${name}.`

    for (const [key, value] of Object.entries(globalState)) {
      if (key.startsWith(prefix)) {
        const pureKey = key.slice(prefix.length)
        segmentState[pureKey] = value
      }
    }

    return dataUtils.unflatten(segmentState) as T
  }
}

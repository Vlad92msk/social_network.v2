import type { IStorage } from './storage.interface'
import { dataUtils } from './storage.utils'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'

@Injectable()
export class StateManager extends BaseModule {
  readonly name = 'stateManager'

  private subscribers = new Map<string, Set<(value: any) => void>>()

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('storage') private readonly storage: IStorage,
  ) {
    super(container)
  }

  protected async registerServices(): Promise<void> {
    // Нет необходимости регистрировать дополнительные сервисы
  }

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('storage', async (event) => {
      if (event.type === 'storage:changed') {
        this.notifySubscribers(event.payload.key, event.payload.value)
        this.logger.debug('Storage changed:', event.payload)
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    this.subscribers.clear()
  }

  // Public API
  async getState(): Promise<Record<string, any>> {
    const keys = await this.storage.keys()
    const flatState: Record<string, any> = {}

    for (const key of keys) {
      const value = await this.storage.get(key)
      flatState[key] = value
    }

    return dataUtils.unflatten(flatState)
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.storage.get<T>(key)
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.storage.set(key, value)
    await this.eventBus.emit({
      type: 'storage:changed',
      payload: { key, value },
    })
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(key)
    await this.eventBus.emit({
      type: 'storage:changed',
      payload: { key, value: undefined },
    })
  }

  subscribe<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }

    const subscribers = this.subscribers.get(key)!
    subscribers.add(callback)

    return () => {
      const subs = this.subscribers.get(key)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          this.subscribers.delete(key)
        }
      }
    }
  }

  private notifySubscribers(key: string, value: any): void {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach((callback) => callback(value))
    }
  }
}

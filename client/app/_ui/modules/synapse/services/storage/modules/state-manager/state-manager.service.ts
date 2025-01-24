import { Inject, Injectable } from '../../../../decorators'
import { BaseModule } from '../../../core/base.service'
import type { IDIContainer } from '../../../di-container/di-container.interface'
import type { IStorage } from '../../storage.interface'

@Injectable()
export class StateManager extends BaseModule {
  readonly name = 'stateManager'

  private cache: Record<string, any> | null = null

  private subscribers = new Set<(state: Record<string, any>) => void>()

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('storage') private storage: IStorage,
  ) {
    super(container)
  }

  async getState(): Promise<Record<string, any>> {
    if (!this.cache) {
      const keys = await this.storage.keys()
      const state = {}
      for (const key of keys) {
        state[key] = await this.storage.get(key)
      }
      this.cache = state
    }
    return this.cache
  }

  async get<T>(path: string): Promise<T | undefined> {
    return this.storage.get<T>(path)
  }

  async set<T>(path: string, value: T): Promise<void> {
    await this.storage.set(path, value)
    this.cache = null
    await this.notifySubscribers()
  }

  async patch(updates: Record<string, any>): Promise<void> {
    for (const [path, value] of Object.entries(updates)) {
      await this.storage.set(path, value)
    }
    this.cache = null
    await this.notifySubscribers()
  }

  subscribe(fn: (state: Record<string, any>) => void): () => void {
    this.subscribers.add(fn)
    this.getState().then((state) => fn(state))
    return () => this.subscribers.delete(fn)
  }

  private async notifySubscribers(): Promise<void> {
    const state = await this.getState()
    this.subscribers.forEach((fn) => fn(state))
  }

  protected async registerServices(): Promise<void> {}

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('app', (event) => {
      if (event.type === 'app:cleanup') this.cleanupResources()
    })
  }

  protected async cleanupResources(): Promise<void> {
    this.subscribers.clear()
    this.cache = null
  }
}

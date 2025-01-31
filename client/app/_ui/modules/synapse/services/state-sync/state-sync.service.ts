import { StateStorage, StateSyncConfig, SyncMessage } from './state-sync.interface'

export class StateSyncModule {
  private readonly storage: StateStorage

  private readonly channel: BroadcastChannel

  private readonly tabId: string

  private readonly subscribers = new Map<string, Set<(value: any) => void>>()

  private readonly debug: boolean

  constructor(config: StateSyncConfig) {
    this.storage = config.storage
    this.channel = new BroadcastChannel(config.channelName || 'app_state_sync')
    this.tabId = crypto.randomUUID()
    this.debug = config.debug || false

    // Инициализируем слушатель событий
    this.initMessageHandler()
  }

  private initMessageHandler(): void {
    this.channel.onmessage = async (event: MessageEvent<SyncMessage>) => {
      const message = event.data

      // Игнорируем собственные сообщения
      if (message.tabId === this.tabId) {
        return
      }

      this.log('Received message:', message)

      switch (message.type) {
        case 'state:update':
          if (message.key) {
            await this.storage.set(message.key, message.value)
            this.notifySubscribers(message.key, message.value)
          }
          break

        case 'state:delete':
          if (message.key) {
            await this.storage.delete(message.key)
            this.notifySubscribers(message.key, undefined)
          }
          break

        case 'state:clear':
          await this.storage.clear()
          this.notifyAllSubscribers()
          break
      }
    }
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[StateSyncModule]', ...args)
    }
  }

  private notifySubscribers(key: string, value: any): void {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach((callback) => callback(value))
    }
  }

  private notifyAllSubscribers(): void {
    this.subscribers.forEach((subscribers, key) => {
      subscribers.forEach((callback) => callback(undefined))
    })
  }

  private broadcastUpdate<T>(message: SyncMessage<T>): void {
    this.log('Broadcasting:', message)
    this.channel.postMessage(message)
  }

  public async get<T>(key: string): Promise<T | undefined> {
    return this.storage.get<T>(key)
  }

  public async set<T>(key: string, value: T): Promise<void> {
    await this.storage.set(key, value)

    this.broadcastUpdate({
      type: 'state:update',
      key,
      value,
      timestamp: Date.now(),
      tabId: this.tabId,
    })

    this.notifySubscribers(key, value)
  }

  public async delete(key: string): Promise<void> {
    await this.storage.delete(key)

    this.broadcastUpdate({
      type: 'state:delete',
      key,
      timestamp: Date.now(),
      tabId: this.tabId,
    })

    this.notifySubscribers(key, undefined)
  }

  public async clear(): Promise<void> {
    await this.storage.clear()

    this.broadcastUpdate({
      type: 'state:clear',
      timestamp: Date.now(),
      tabId: this.tabId,
    })

    this.notifyAllSubscribers()
  }

  public subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }

    this.subscribers.get(key)!.add(callback)

    return () => {
      const subscribers = this.subscribers.get(key)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(key)
        }
      }
    }
  }

  public destroy(): void {
    this.channel.close()
    this.subscribers.clear()
  }
}

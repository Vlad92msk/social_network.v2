import { IStoragePlugin } from '../../services/storage/storage.interface'
import { SyncMessage } from '../../services/state-sync/state-sync.interface'

export class StateSyncPlugin implements IStoragePlugin {
  private readonly channel: BroadcastChannel

  private readonly tabId: string

  private readonly debug: boolean

  public readonly name = 'StateSyncPlugin'

  constructor(options: { channelName?: string; debug?: boolean } = {}) {
    this.channel = new BroadcastChannel(options.channelName || 'app_state_sync')
    this.tabId = crypto.randomUUID()
    this.debug = options.debug || false

    this.initMessageHandler()
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log(`[${this.name}]`, ...args)
    }
  }

  private initMessageHandler(): void {
    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data
      if (message.tabId === this.tabId) return

      this.log('Received message:', message)
    }
  }

  private broadcast<T>(type: SyncMessage['type'], key: string, value?: T): void {
    const message: SyncMessage<T> = {
      type,
      key,
      value,
      timestamp: Date.now(),
      tabId: this.tabId,
    }

    this.log('Broadcasting:', message)
    this.channel.postMessage(message)
  }

  // Реализация интерфейса IStoragePlugin
  onBeforeSet<T>(key: string, value: T): T {
    return value
  }

  onAfterSet<T>(key: string, value: T): void {
    this.broadcast('state:update', key, value)
  }

  onBeforeGet<T>(key: string): string {
    return key
  }

  onAfterGet<T>(key: string, value: T | undefined): T | undefined {
    return value
  }

  onBeforeDelete(key: string): boolean {
    return true
  }

  onAfterDelete(key: string): void {
    this.broadcast('state:delete', key)
  }

  onClear(): void {
    this.broadcast('state:clear', '')
  }

  // Методы жизненного цикла плагина
  onInit(): void {
    this.log('Plugin initialized')
  }

  onDestroy(): void {
    this.log('Plugin destroying...')
    this.channel.close()
  }
}

// base-storage.service.ts
import { StoragePluginManager } from './plugin-manager.service'
import type { IStorage, IStorageConfig } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import type { Event, IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export abstract class BaseStorage implements IStorage {
  constructor(
    @Inject('STORAGE_CONFIG') protected readonly config: IStorageConfig,
    protected readonly pluginManager: StoragePluginManager,
    @Inject('eventBus') protected readonly eventBus: IEventBus,
    protected readonly logger: ILogger,
  ) {}

  protected async emitEvent(event: Event): Promise<void> {
    try {
      await this.eventBus.emit({
        ...event,
        metadata: {
          ...(event.metadata || {}),
          timestamp: Date.now(),
          storageType: this.config.type || 'memory',
        },
      })
    } catch (error) {
      this.logger.error('Error emitting event', { event, error })
    }
  }

  abstract get<T>(key: string): Promise<T | undefined>

  abstract set<T>(key: string, value: T): void

  abstract has(key: string): boolean

  abstract delete(key: string): void

  abstract clear(): void
}

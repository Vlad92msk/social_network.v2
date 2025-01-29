import { SegmentedEventBus } from '@ui/modules/synapse/services/event-bus/event-bus.service'
import { StoragePluginManager } from './plugin-manager.service'
import { IStoragePlugin } from './plugin-managers.interface'

export class GlobalPluginManager extends StoragePluginManager {
  readonly name = 'pluginManager'

  constructor(
    protected readonly eventBus: SegmentedEventBus,
  ) {
    super()
  }

  async initialize(): Promise<void> {
    // Создаем сегмент для событий плагинов если его еще нет
    if (!this.eventBus.hasSegment('storage-plugins')) {
      this.eventBus.createSegment({
        name: 'storage-plugins',
        eventTypes: ['storage:plugin:added', 'storage:plugin:removed'],
        priority: 1000,
      })
    }
  }

  protected async onPluginAdded(plugin: IStoragePlugin): Promise<void> {
    await this.eventBus.emit({
      type: 'storage:plugin:added',
      payload: {
        name: plugin.name,
        scope: 'global',
      },
    })
  }

  protected async onPluginRemoved(name: string): Promise<void> {
    await this.eventBus.emit({
      type: 'storage:plugin:removed',
      payload: {
        name,
        scope: 'global',
      },
    })
  }

  protected getPluginsToExecute(): IStoragePlugin[] {
    return this.getAll()
  }
}

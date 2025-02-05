import { IndexedDBStorage } from '@ui/modules/synapse/services/storage/adapters/indexed-DB.service'
import { LocalStorage } from '@ui/modules/synapse/services/storage/adapters/local-storage.service'
import { MemoryStorage } from '@ui/modules/synapse/services/storage/adapters/memory-storage.service'
import {
  CreateSegmentConfig,
  ISegmentManager,
  IStorageSegment,
} from './segment.interface'
import { StorageSegment } from './segment.service'
import {
  ILogger,
  IStorage,
  StorageConfig,
} from '../../storage.interface'
import { StoragePluginManager } from '../plugin-manager/plugin-manager.service'
import { IPluginExecutor } from '../plugin-manager/plugin-managers.interface'
import { SegmentPluginManager } from '../plugin-manager/segment-plugin-manager.service'
import { SelectorModule } from '../selector-module/selector.module'

export type StorageFactory = (config: StorageConfig) => IStorage;

export class SegmentManager implements ISegmentManager {
  private segments = new Map<string, StorageSegment<any>>()

  private pluginManagers = new Map<string, StoragePluginManager>()

  constructor(
    private readonly storageFactory: StorageFactory,
    private readonly parentPluginExecutor?: IPluginExecutor,
    private readonly logger?: ILogger,
  ) {}

  async createSegment<T extends Record<string, any>>(
    config: CreateSegmentConfig<T>,
  ): Promise<IStorageSegment<T>> {
    if (this.segments.has(config.name)) {
      throw new Error(`Segment ${config.name} already exists`)
    }

    // Создаем хранилище для сегмента
    const storage = await this.storageFactory(config).initialize()


    console.log('storage', storage)
    // Создаем менеджер селекторов для сегмента
    const selectorModule = new SelectorModule(storage, this.logger)
    console.log('selectorModule', selectorModule)
    // Создаем менеджер плагинов для сегмента
    const pluginManager = new SegmentPluginManager(
      config.name,
      this.parentPluginExecutor,
      this.logger,
    )
    if (config.plugins?.length) {
      await Promise.all(
        config.plugins.map((plugin) => pluginManager.add(plugin)),
      )
    }

    this.pluginManagers.set(config.name, pluginManager)

    // Устанавливаем начальное состояние
    if (config.initialState) {
      await storage.set(config.name, config.initialState)
    }

    // Создаем сегмент
    const segment = new StorageSegment<T>(
      config.name,
      storage,
      selectorModule,
      pluginManager,
      this.logger,
    )

    this.segments.set(config.name, segment)
    return segment
  }

  async destroy() {
    for (const [name, segment] of this.segments) {
      await segment.clear()
    }

    this.segments.clear()
  }
}

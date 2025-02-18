import { StoragePluginModule } from '@ui/modules/synapse/services/storage/modules/plugin/plugin.service'
import { IPluginExecutor } from '@ui/modules/synapse/services/storage/modules/plugin/plugin.interface'
import { SelectorModule } from '@ui/modules/synapse/services/storage/modules/selector/selector.module'
import { ILogger, IStorage, StorageConfig, } from '../../storage/storage.interface'
import { SegmentPluginManager } from '../segment-plugin-manager.service'
import { CreateSegmentConfig, ISegmentManager, IStorageSegment, } from './segment.interface'
import { StorageSegment } from './segment.service'

export type StorageFactory = (config: StorageConfig) => IStorage;

export class SegmentManager implements ISegmentManager {
  private segments = new Map<string, StorageSegment<any>>()

  private pluginManagers = new Map<string, StoragePluginModule>()

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

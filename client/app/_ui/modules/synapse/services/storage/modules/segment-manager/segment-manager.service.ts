import {
  CreateSegmentConfig,
  ISegmentManager,
  IStorageSegment,
} from './segment.interface'
import { StorageSegment } from './segment.service'
import { SelectorManager } from './selector-manager.service'
import {
  ILogger,
  IStorage,
  StorageConfig,
} from '../../storage.interface'
import { StoragePluginManager } from '../plugin-manager/plugin-manager.service'
import { IPluginExecutor } from '../plugin-manager/plugin-managers.interface'
import { SegmentPluginManager } from '../plugin-manager/segment-plugin-manager.service'

export type StorageFactory = (config: StorageConfig) => Promise<IStorage>;

export class SegmentManager implements ISegmentManager {
  private segments = new Map<string, StorageSegment<any>>()

  private storages = new Map<string, IStorage>()

  private pluginManagers = new Map<string, StoragePluginManager>()

  constructor(
    private readonly storageFactory: StorageFactory,
    private readonly selectorManager: SelectorManager,
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
    const storage = await this.storageFactory(config)
    this.storages.set(config.name, storage)

    // Создаем менеджер плагинов для сегмента
    const pluginManager = new SegmentPluginManager(
      config.name,
      this.parentPluginExecutor,
      this.logger,
    )
    this.pluginManagers.set(config.name, pluginManager)

    // Устанавливаем начальное состояние
    if (config.initialState) {
      await storage.set(config.name, config.initialState)
    }

    // Создаем сегмент
    const segment = new StorageSegment<T>(
      config.name,
      storage,
      this.selectorManager,
      pluginManager,
      this.logger,
    )

    this.segments.set(config.name, segment)
    return segment
  }

  async destroy(): Promise<void> {
    // Очищаем все сегменты и их ресурсы
    for (const [name, segment] of this.segments) {
      await segment.clear()

      const pluginManager = this.pluginManagers.get(name)
      if (pluginManager) {
        await pluginManager.destroy()
      }

      const storage = this.storages.get(name)
      if (storage) {
        await storage.destroy()
      }
    }

    this.segments.clear()
    this.storages.clear()
    this.pluginManagers.clear()
  }
}

import { StoragePluginModule } from '@ui/modules/synapse/services/storage/modules/plugin/plugin.service'
import { IPluginExecutor, IStoragePlugin } from '@ui/modules/synapse/services/storage/modules/plugin/plugin.interface'
import { ILogger } from '../storage/storage.interface'

export class SegmentPluginManager extends StoragePluginModule {
  constructor(
    private readonly segmentName: string,
    parentExecutor?: IPluginExecutor,
    logger?: ILogger,
  ) {
    super(parentExecutor, logger)
  }

  public async add(plugin: IStoragePlugin): Promise<void> {
    await super.add(plugin)
    this.logger?.info('Plugin added to segment', {
      name: plugin.name,
      segmentName: this.segmentName,
    })
  }

  public async remove(name: string): Promise<void> {
    await super.remove(name)
    this.logger?.info('Plugin removed from segment', {
      name,
      segmentName: this.segmentName,
    })
  }

  // Переопределяем методы executor'а для правильного порядка выполнения
  public executeBeforeSet<T>(key: string, value: T): T {
    // Сначала выполняем parentExecutor, затем локальные плагины
    const parentResult = this.parentExecutor?.executeBeforeSet(key, value) ?? value
    return super.executeBeforeSet(key, parentResult)
  }

  public executeAfterSet<T>(key: string, value: T): void {
    // Сначала локальные плагины, затем parentExecutor
    super.executeAfterSet(key, value)
    this.parentExecutor?.executeAfterSet(key, value)
  }

  public executeBeforeGet(key: string): string {
    const parentResult = this.parentExecutor?.executeBeforeGet(key) ?? key
    return super.executeBeforeGet(parentResult)
  }

  public executeAfterGet<T>(key: string, value: T | undefined): T | undefined {
    const localResult = super.executeAfterGet(key, value)
    return this.parentExecutor?.executeAfterGet(key, localResult) ?? localResult
  }

  public executeBeforeDelete(key: string): boolean {
    // Для delete нужно проверить разрешения обоих уровней
    const parentCanDelete = this.parentExecutor?.executeBeforeDelete(key) ?? true
    return parentCanDelete && super.executeBeforeDelete(key)
  }

  public executeAfterDelete(key: string): void {
    super.executeAfterDelete(key)
    this.parentExecutor?.executeAfterDelete(key)
  }

  public executeOnClear(): void {
    super.executeOnClear()
    this.parentExecutor?.executeOnClear()
  }

  public async initialize(): Promise<void> {
    await super.initialize()
    this.logger?.info('Segment plugin manager initialized', {
      segmentName: this.segmentName,
    })
  }

  public async destroy(): Promise<void> {
    await super.destroy()
    this.logger?.info('Segment plugin manager destroyed', {
      segmentName: this.segmentName,
    })
  }
}

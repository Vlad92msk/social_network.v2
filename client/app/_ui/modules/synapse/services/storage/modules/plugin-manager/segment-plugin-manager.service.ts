import { GlobalPluginManager } from './global-plugin-manager.service'
import { StoragePluginManager } from './plugin-manager.service'
import { IStoragePlugin } from './plugin-managers.interface'

export class SegmentPluginManager extends StoragePluginManager {
  readonly name: string

  constructor(
    private readonly segmentName: string,
    private readonly globalPluginManager: GlobalPluginManager,
  ) {
    super()
    this.name = `${segmentName}PluginManager`
  }

  protected async onPluginAdded(plugin: IStoragePlugin): Promise<void> {
    this.logger.info('Plugin added to segment', {
      name: plugin.name,
      scope: 'segment',
      segmentName: this.segmentName,
    })
  }

  protected async onPluginRemoved(name: string): Promise<void> {
    this.logger.info('Plugin removed from segment', {
      name,
      scope: 'segment',
      segmentName: this.segmentName,
    })
  }

  executeBeforeSet<T>(key: string, value: T): T {
    // Убираем возможность undefined для globalPluginManager
    return super.executeBeforeSet(key, this.globalPluginManager.executeBeforeSet(key, value))
  }

  executeAfterSet<T>(key: string, value: T): void {
    this.globalPluginManager.executeAfterSet(key, value)
    super.executeAfterSet(key, value)
  }

  executeBeforeGet(key: string): string {
    return super.executeBeforeGet(this.globalPluginManager.executeBeforeGet(key))
  }

  executeAfterGet<T>(key: string, value: T | undefined): T | undefined {
    return super.executeAfterGet(key, this.globalPluginManager.executeAfterGet(key, value))
  }

  executeBeforeDelete(key: string): boolean {
    return this.globalPluginManager.executeBeforeDelete(key) && super.executeBeforeDelete(key)
  }

  executeAfterDelete(key: string): void {
    this.globalPluginManager.executeAfterDelete(key)
    super.executeAfterDelete(key)
  }

  protected getPluginsToExecute(): IStoragePlugin[] {
    return this.getAll()
  }

  executeOnClear(): void {
    this.globalPluginManager.executeOnClear()
    super.executeOnClear()
  }
}

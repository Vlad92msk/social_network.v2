import { ILogger } from '../../storage.interface'
import { StoragePluginManager } from './plugin-manager.service'
import { IStoragePlugin } from './plugin-managers.interface'

export class GlobalPluginManager extends StoragePluginManager {
  readonly name = 'pluginManager'

  constructor(
    logger?: ILogger,
  ) {
    super(undefined, logger)
  }

  async initialize(): Promise<void> {
  }

  public async add(plugin: IStoragePlugin): Promise<void> {
    await super.add(plugin)
  }

  public async remove(name: string): Promise<void> {
    await super.remove(name)
  }

  protected getPluginsToExecute(): IStoragePlugin[] {
    return this.getAll()
  }
}

import { ILogger } from '../storage/storage.interface'
import { StoragePluginModule } from '@ui/modules/synapse/services/storage/modules/plugin/plugin.service'
import { IStoragePlugin } from '@ui/modules/synapse/services/storage/modules/plugin/plugin.interface'

export class GlobalPluginManager extends StoragePluginModule {
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

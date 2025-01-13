// services/pluginManager.ts
import { Injectable } from '@ui/modules/synapse/decorators'
import { ServiceContainer } from './container'
import { Logger } from './logger'
import {
  GlobalPlugin,
  Plugin,
  PluginMetadata,
  ServicePlugin,
} from '../types/plugin'

@Injectable()
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()

  private installedPlugins: Set<string> = new Set()

  constructor(
    private logger: Logger,
    private container: ServiceContainer,
  ) {}

  public async installGlobal(plugin: GlobalPlugin): Promise<void> {
    await this.installPlugin(plugin)
  }

  public async installService(plugin: ServicePlugin): Promise<void> {
    await this.installPlugin(plugin)
  }

  private async installPlugin(plugin: Plugin): Promise<void> {
    const { name, version } = plugin.metadata
    const pluginId = `${name}@${version}`

    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered`)
    }

    // Проверяем зависимости
    await this.checkDependencies(plugin.metadata)

    // Проверяем конфликты
    await this.checkConflicts(plugin.metadata)

    // Устанавливаем плагин
    try {
      await plugin.install(this.container)
      this.plugins.set(pluginId, plugin)
      this.installedPlugins.add(pluginId)

      this.logger.info(`Installed plugin: ${pluginId}`)
    } catch (error) {
      this.logger.error(`Failed to install plugin: ${pluginId}`, error)
      throw error
    }
  }

  private async checkDependencies(metadata: PluginMetadata): Promise<void> {
    if (!metadata.dependencies?.length) {
      return
    }

    const missingDependencies = metadata.dependencies.filter(
      (dep) => !this.installedPlugins.has(dep),
    )

    if (missingDependencies.length > 0) {
      throw new Error(
        `Missing dependencies for plugin ${metadata.name}: ${missingDependencies.join(', ')}`,
      )
    }
  }

  private async checkConflicts(metadata: PluginMetadata): Promise<void> {
    if (!metadata.conflicts?.length) {
      return
    }

    const existingConflicts = metadata.conflicts.filter(
      (conflict) => this.installedPlugins.has(conflict),
    )

    if (existingConflicts.length > 0) {
      throw new Error(
        `Plugin ${metadata.name} conflicts with: ${existingConflicts.join(', ')}`,
      )
    }
  }

  public async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (plugin.uninstall) {
      await plugin.uninstall(this.container)
    }

    this.plugins.delete(pluginId)
    this.installedPlugins.delete(pluginId)

    this.logger.info(`Uninstalled plugin: ${pluginId}`)
  }
}

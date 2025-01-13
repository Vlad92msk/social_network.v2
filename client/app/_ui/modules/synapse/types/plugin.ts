import { ServiceIdentifier } from './container'
import { ServiceContainer } from '../services/container'

export interface PluginMetadata {
  name: string
  version: string
  dependencies?: string[]
  conflicts?: string[]
  priority?: number
}

export interface Plugin {
  metadata: PluginMetadata
  install(container: ServiceContainer): void | Promise<void>
  uninstall?(container: ServiceContainer): void | Promise<void>
}

export interface GlobalPlugin extends Plugin {
  type: 'global'
}

export interface ServicePlugin extends Plugin {
  type: 'service'
  service: ServiceIdentifier
}

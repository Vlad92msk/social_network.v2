export interface IPlugin {
  name: string
  initialize?(): Promise<void>
  destroy?(): Promise<void>
}

export interface IStoragePlugin extends IPlugin {
  onBeforeSet?<T>(key: string, value: T): T
  onAfterSet?<T>(key: string, value: T): void
  onBeforeGet?<T>(key: string): string
  onAfterGet?<T>(key: string, value: T | undefined): T | undefined
  onBeforeDelete?(key: string): boolean
  onAfterDelete?(key: string): void
  onClear?(): void
}

export interface IPluginExecutor {
  executeBeforeSet<T>(key: string, value: T): T
  executeAfterSet<T>(key: string, value: T): void
  executeBeforeGet(key: string): string
  executeAfterGet<T>(key: string, value: T | undefined): T | undefined
  executeBeforeDelete(key: string): boolean
  executeAfterDelete(key: string): void
  executeOnClear(): void
}

export interface IPluginManager<T extends IPlugin> {
  add(plugin: T): Promise<void>
  remove(name: string): Promise<void>
  get(name: string): T | undefined
  getAll(): T[]
  initialize(): Promise<void>
  destroy(): Promise<void>
}

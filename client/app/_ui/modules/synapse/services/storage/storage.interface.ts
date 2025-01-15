import { IPlugin, Middleware } from '../core/core.interface'

export interface IStorage {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  has(key: string): boolean
  delete(key: string): void
  clear(): void
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

export interface IStorageConfig {
  initialState?: Record<string, any>
  type?: 'memory' | 'indexDB' | 'localStorage'
  options?: {
    prefix?: string
    query?: string
  };
  plugins?: IStoragePlugin[]
  middlewares?: (getDefaultMiddleware: () => Middleware[]) => Middleware[]
}

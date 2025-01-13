export interface IModule {
  name: string
  dependencies?: string[] // имена других модулей, от которых зависит данный модуль
  initialize(): Promise<void>
  destroy(): Promise<void>
}

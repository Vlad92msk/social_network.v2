// storage.interface.ts
import { IndexedDBConfig } from './adapters/indexed-DB.service'

export interface IStorage {
  name: string
  get<T>(key: string): Promise<T | undefined>
  getState<T>(): Promise<Record<string, any>>
  set<T>(key: string, value: T): Promise<void>
  update(updater: (state: any) => void): Promise<void>
  has(key: string): Promise<boolean>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
  subscribe(key: string, callback: (value: any) => void): VoidFunction
  destroy(): Promise<void>
  subscribeToAll(callback: (event: { type: string; key?: string; value?: any }) => void): VoidFunction

  initialize(): Promise<this>
  // Добавляем метод для внешних изменений
  handleExternalChange(event: StorageChangeEvent): Promise<void>
}

export enum StorageEvents {
  STORAGE_UPDATE = 'storage:update',
  STORAGE_DELETE = 'storage:delete',
  STORAGE_PATCH = 'storage:patch',
  STORAGE_SELECT = 'storage:select',
  STORAGE_CLEAR = 'storage:clear',
  STORAGE_DESTROY = 'storage:destroy'
}

export interface StorageEvent<T = any> {
  type: string;
  payload?: T;
  metadata?: Record<string, any>;
}

export interface IEventEmitter {
  emit(event: StorageEvent): Promise<void>;
}

export interface ILogger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
}

// Middleware types
export type OperationType = 'get' | 'set' | 'delete' | 'clear' | 'keys' | 'init'

export interface StorageContext<T = any> {
  type: OperationType
  key?: string
  value?: T
  metadata?: Record<string, any>
  segment?: string
  baseOperation?: NextFunction
  storage?: IStorage
}

export type NextFunction = (context: StorageContext) => Promise<any>;

export interface MiddlewareOptions {
  segments?: string[]
  [key: string]: any
}

export interface Middleware {
  (ctx: StorageContext): (next: NextFunction) => Promise<any>
  options?: MiddlewareOptions
}

// Middleware configurations
export type GetDefaultMiddleware = (options?: DefaultMiddlewareOptions) => Middleware[];
export type MiddlewareFunction = (getDefaultMiddleware: GetDefaultMiddleware) => Middleware[];
export type MiddlewareArray = Middleware[];
export type MiddlewareConfig = MiddlewareArray | MiddlewareFunction;
export type MiddlewareFactory<TOptions = MiddlewareOptions> = (options?: TOptions) => Middleware;

// Middleware specific options
export interface BatchingMiddlewareOptions extends MiddlewareOptions {
  batchSize?: number
  batchDelay?: number
}

export interface ShallowCompareMiddlewareOptions extends MiddlewareOptions {
  comparator?: <T>(prev: T, next: T) => boolean
}

export interface DefaultMiddlewareOptions extends MiddlewareOptions {
  batching?: boolean | BatchingMiddlewareOptions
  shallowCompare?: boolean | ShallowCompareMiddlewareOptions
}

// Configuration
export interface StorageConfig {
  name: string
  initialState?: Record<string, any>
  middlewares?: MiddlewareFunction
}

export type StorageType = 'memory' | 'localStorage' | 'indexedDB';

// Уточним специфичные конфиги для разных типов хранилищ
export interface MemoryStorageConfig extends StorageConfig {
  type: 'memory';
}

export interface LocalStorageConfig extends StorageConfig {
  type: 'localStorage';
}

export interface IndexedDBStorageConfig extends StorageConfig {
  type: 'indexedDB';
  options: IndexedDBConfig;
}

export interface StorageChangeEvent {
  type: 'set' | 'delete' | 'clear';
  key?: string;
  value?: any;
  source?: 'broadcast' | 'websocket' | 'server' | string;
  timestamp?: number;
  storageName?: string
}

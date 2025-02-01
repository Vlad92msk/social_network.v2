// storage.interface.ts
import { IndexedDBConfig } from '@ui/modules/synapse/services/storage/adapters/indexed-DB.service'
import { IStoragePlugin } from '@ui/modules/synapse/services/storage/modules/plugin-manager/plugin-managers.interface'

export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  subscribe(key: string, callback: (value: any) => void): () => void;
  destroy(): Promise<void>;
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
export type OperationType = 'get' | 'set' | 'delete' | 'clear' | 'keys';

export interface StorageContext<T = any> {
  type: OperationType;
  key?: string;
  value?: T;
  metadata?: Record<string, any>;
  segment?: string;
  baseOperation?: NextFunction;
}

export type NextFunction = (context: StorageContext) => Promise<any>;

export interface Middleware {
  (next: NextFunction): NextFunction;
  options?: MiddlewareOptions;
}

export interface MiddlewareOptions {
  segments?: string[];
  [key: string]: any;
}

// Middleware configurations
export type GetDefaultMiddleware = (options?: DefaultMiddlewareOptions) => Middleware[];
export type MiddlewareFunction = (getDefaultMiddleware: GetDefaultMiddleware) => Middleware[];
export type MiddlewareArray = Middleware[];
export type MiddlewareConfig = MiddlewareArray | MiddlewareFunction;
export type MiddlewareFactory<TOptions = MiddlewareOptions> = (options?: TOptions) => Middleware;

// Middleware specific options
export interface BatchingMiddlewareOptions extends MiddlewareOptions {
  batchSize?: number;
  batchDelay?: number;
}

export interface ShallowCompareMiddlewareOptions extends MiddlewareOptions {
  comparator?: <T>(prev: T, next: T) => boolean;
}

export interface DefaultMiddlewareOptions extends MiddlewareOptions {
  batching?: BatchingMiddlewareOptions | false;
  shallowCompare?: ShallowCompareMiddlewareOptions | false;
}

// Configuration
export interface StorageConfig {
  initialState?: Record<string, any>;
  middlewares?: MiddlewareFunction;
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

// Сделаем StorageModuleConfig более строгим через union type
export type StorageModuleConfig = {
  plugins?: IStoragePlugin[];
} & (
  | MemoryStorageConfig
  | LocalStorageConfig
  | IndexedDBStorageConfig
  );

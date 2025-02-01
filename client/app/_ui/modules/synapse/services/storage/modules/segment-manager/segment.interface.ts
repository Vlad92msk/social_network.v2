// segment.interface.ts
import { IndexedDBConfig } from '../../adapters/indexed-DB.service'
import { StorageConfig, StorageType } from '../../storage.interface'
import { IStoragePlugin } from '../plugin-manager/plugin-managers.interface'

export interface Selector<T, R> {
  (state: T): R;
}

export interface ResultFunction<Deps extends any[], R> {
  (...args: Deps): R;
}

export interface SelectorOptions<T> {
  equals?: (a: T, b: T) => boolean;
  name?: string;
}

export interface Subscriber<T> {
  notify: (value: T) => void | Promise<void>;
}

export interface Subscribable<T> {
  subscribe: (subscriber: Subscriber<T>) => () => void;
}

export interface SelectorAPI<T> {
  select: () => Promise<T>;
  subscribe: (subscriber: Subscriber<T>) => () => void;
}

export interface IStorageSegment<T extends Record<string, any>> extends Subscribable<T> {
  select: <R>(selector: Selector<T, R>) => Promise<R>;
  update: (updater: (state: T) => void) => Promise<void>;
  patch: (value: Partial<T>) => Promise<void>;
  getByPath: <R>(path: string) => Promise<R | undefined>;
  setByPath: <R>(path: string, value: R) => Promise<void>;
  clear: () => Promise<void>;
  createSelector: {
    <R>(selector: Selector<T, R>, options?: SelectorOptions<R>): SelectorAPI<R>;
    <Deps extends any[], R>(
      dependencies: Array<Selector<T, Deps[number]> | SelectorAPI<Deps[number]>>,
      resultFn: ResultFunction<Deps, R>,
      options?: SelectorOptions<R>
    ): SelectorAPI<R>;
  };
}

export interface CreateSegmentConfig<T> extends StorageConfig {
  name: string;
  type: StorageType;
  plugins?: IStoragePlugin[]; // локальные плагины для сегмента
  options?: IndexedDBConfig; // специфичные опции для разных типов хранилищ
  isRoot?: boolean;
}

export interface ISegmentManager {
  createSegment<T extends Record<string, any>>(config: CreateSegmentConfig<T>): Promise<IStorageSegment<T>>;
  destroy(): Promise<void>;
}

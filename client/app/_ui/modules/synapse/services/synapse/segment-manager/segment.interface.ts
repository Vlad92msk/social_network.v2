// segment.interface.ts
import { IndexedDBConfig } from '../../storage/adapters/indexed-DB.service'
import { IPluginExecutor, IStoragePlugin } from '@ui/modules/synapse/services/storage/modules/plugin/plugin.interface'
import { ResultFunction, Selector, SelectorAPI, SelectorOptions, Subscribable } from '@ui/modules/synapse/services/storage/modules/selector/selector.interface'
import { StorageConfig, StorageType } from '../../storage/storage.interface'

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
  pluginExecutor?: IPluginExecutor
}

export interface ISegmentManager {
  createSegment<T extends Record<string, any>>(config: CreateSegmentConfig<T>): Promise<IStorageSegment<T>>;
  destroy(): Promise<void>;
}

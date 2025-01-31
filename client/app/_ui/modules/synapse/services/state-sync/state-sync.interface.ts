export interface StateStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
export interface SyncMessage<T = any> {
  type: 'state:update' | 'state:delete' | 'state:clear';
  key?: string;
  value?: T;
  timestamp: number;
  tabId: string;
}

export interface StateSyncConfig {
  storage: StateStorage;
  channelName?: string;
  debug?: boolean;
}

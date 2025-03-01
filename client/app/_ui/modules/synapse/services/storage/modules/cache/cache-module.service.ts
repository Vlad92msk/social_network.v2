// cache-module.service.ts

import { StorageKey, StorageKeyType } from '../../utils/storage-key'

export interface CacheMetadata {
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  accessCount: number;
  tags?: string[];
  createdAtDateTime: string;
  updatedAtDateTime: string;
  expiresAtDateTime: string;
}

// Правило кэширования для конкретного ключа
export interface CacheRule {
  method: string;
  ttl?: number;
  tags?: string[];
  invalidateTags?: string[];
}

export interface CacheOptions {
  ttl?: number;
  cleanup?: {
    enabled: boolean;
    interval?: number;
  };
  invalidateOnError?: boolean;
  rules?: CacheRule[];
}

export interface CacheParams {
  url: string;
  query?: Record<string, any>;
  [key: string]: any;
}

export interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata;
  params: CacheParams;
}

export class CacheUtils {
  static createMetadata(ttl: number = 0, tags: string[] = []): CacheMetadata {
    const now = Date.now()
    const expiresAt = ttl > 0 ? now + ttl : Infinity

    return {
      createdAt: now,
      updatedAt: now,
      expiresAt,
      accessCount: 0,
      tags,
      createdAtDateTime: this.formatDateTime(now),
      updatedAtDateTime: this.formatDateTime(now),
      expiresAtDateTime: expiresAt === Infinity ? 'never' : this.formatDateTime(expiresAt),
    }
  }

  private static formatDateTime(timestamp: number): string {
    return new Date(timestamp).toISOString()
  }

  static isExpired(metadata: CacheMetadata): boolean {
    return Date.now() > metadata.expiresAt
  }

  static updateMetadata(metadata: CacheMetadata): CacheMetadata {
    return {
      ...metadata,
      updatedAt: Date.now(),
      accessCount: metadata.accessCount + 1,
    }
  }

  static createKey(...parts: (string | number)[]): StorageKey {
    return new StorageKey(parts.join('_'))
  }

  static createApiKey(endpoint: string, params?: Record<string, any>): [StorageKeyType, Record<string, any> | undefined] {
    if (!params) return [new StorageKey(endpoint, true), params]

    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    return [new StorageKey(`${endpoint}_${sortedParams}`, true), params]
  }

  static findRule(key: StorageKeyType, rules: CacheRule[] = []): CacheRule | undefined {
    const keyStr = key.toString()
    const methodName = keyStr.split('_')[0]
    return rules.find((rule) => rule.method === methodName)
  }

  // Функция для проверки, есть ли у записи определенные теги
  static hasAnyTag(metadata: CacheMetadata, tags: string[] = []): boolean {
    if (!metadata.tags || !tags.length) return false
    return tags.some((tag) => metadata.tags?.includes(tag))
  }
}

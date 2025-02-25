/**
 * Функции-помощники для API
 */

/**
 * Логгер для API
 */
export const apiLogger = {
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[API] ${message}`, ...args);
    }
  },
  
  log: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    console.info(`[API] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[API] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[API] ${message}`, ...args);
  }
};

/**
 * Создает уникальный идентификатор
 * @returns Строка с уникальным идентификатором
 */
export function createUniqueId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Преобразует объект Headers в обычный объект
 * @param headers Объект Headers
 * @returns Обычный объект с заголовками
 */
export function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

/**
 * Фильтрует заголовки, оставляя только те, которые влияют на кэш
 * @param headers Объект с заголовками
 * @param cacheableHeaderKeys Массив ключей заголовков для кэширования
 * @returns Объект с отфильтрованными заголовками
 */
export function filterCacheableHeaders(
  headers: Record<string, string>,
  cacheableHeaderKeys: string[] = []
): Record<string, string> {
  if (!cacheableHeaderKeys.length) {
    return {};
  }
  
  const result: Record<string, string> = {};
  const lowerCaseKeys = cacheableHeaderKeys.map(key => key.toLowerCase());
  
  Object.entries(headers).forEach(([key, value]) => {
    if (lowerCaseKeys.includes(key.toLowerCase())) {
      result[key.toLowerCase()] = value;
    }
  });
  
  return result;
}

/**
 * Проверяет, является ли значение промисом
 * @param value Проверяемое значение
 * @returns true если значение - Promise
 */
export function isPromise<T = any>(value: any): value is Promise<T> {
  return value && typeof value.then === 'function';
}

/**
 * Глубоко клонирует объект
 * @param obj Объект для клонирования
 * @returns Клонированный объект
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as unknown as T;
  }

  const cloned = {} as Record<string, any>;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, any>)[key]);
    }
  }
  
  return cloned as T;
}

/**
 * Объединяет массивы без дубликатов
 * @param arrays Массивы для объединения
 * @returns Объединенный массив без дубликатов
 */
export function mergeArraysUnique<T>(...arrays: T[][]): T[] {
  return [...new Set(arrays.flat())];
}

/**
 * Возвращает текущее время в ISO формате
 * @returns Текущее время в ISO формате
 */
export function getCurrentISOTime(): string {
  return new Date().toISOString();
}

/**
 * Создаёт сериализуемую версию ошибки
 * @param error Объект ошибки
 * @returns Сериализуемая версия ошибки
 */
export function serializeError(error: any): Error {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } as Error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  return new Error(String(error));
}
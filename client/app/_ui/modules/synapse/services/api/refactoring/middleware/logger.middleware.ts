import { ApiEventType } from '../types/api-events.interface';
import { EnhancedApiMiddleware } from '../types/api-middleware.interface';
import { apiLogger } from '../utils/api-helpers';

/**
 * Опции логгирования
 */
export interface LoggerMiddlewareOptions {
  /** Уровень логирования */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  /** Включать заголовки в логи */
  includeHeaders?: boolean;
  /** Маскировать чувствительные данные */
  maskSensitiveData?: boolean;
  /** Ключи чувствительных данных (для маскирования) */
  sensitiveKeys?: string[];
  /** Логировать тело запроса */
  logRequestBody?: boolean;
  /** Логировать тело ответа */
  logResponseBody?: boolean;
  /** Ограничение длины для тела и заголовков */
  truncateLength?: number;
}

/**
 * Создает middleware для логирования запросов и ответов
 * @param options Опции логирования
 * @returns Middleware для логирования
 */
export function createLoggerMiddleware(options: LoggerMiddlewareOptions = {}): EnhancedApiMiddleware {
  const {
    logLevel = 'info',
    includeHeaders = true,
    maskSensitiveData = true,
    sensitiveKeys = ['authorization', 'password', 'token', 'apikey', 'api-key', 'secret'],
    logRequestBody = true,
    logResponseBody = true,
    truncateLength = 500,
  } = options;
  
  /**
   * Маскирует чувствительные данные
   * @param obj Объект с данными
   * @param keys Ключи для маскирования
   * @returns Копия объекта с маскированными данными
   */
  const maskSensitive = (obj: Record<string, any>, keys: string[]): Record<string, any> => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = { ...obj };
    
    // Преобразуем все ключи в нижний регистр для регистронезависимого сравнения
    const lowerKeys = keys.map(k => k.toLowerCase());
    
    Object.keys(result).forEach(key => {
      // Проверяем, содержит ли ключ или его часть чувствительное слово
      const containsSensitive = lowerKeys.some(k => 
        key.toLowerCase().includes(k) || key.toLowerCase() === k
      );
      
      if (containsSensitive && result[key]) {
        if (typeof result[key] === 'string') {
          // Оставляем первые и последние 2 символа, остальное заменяем звездочками
          const value = result[key];
          result[key] = value.length <= 4 
            ? '****' 
            : `${value.substring(0, 2)}${'*'.repeat(Math.min(value.length - 4, 8))}${value.substring(value.length - 2)}`;
        } else {
          result[key] = '********';
        }
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        // Рекурсивно маскируем вложенные объекты
        result[key] = maskSensitive(result[key], keys);
      }
    });
    
    return result;
  };
  
  /**
   * Ограничивает длину строки
   * @param value Значение для ограничения
   * @param maxLength Максимальная длина
   * @returns Ограниченная строка
   */
  const truncate = (value: any, maxLength: number): any => {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    
    if (value.length <= maxLength) return value;
    
    return value.substring(0, maxLength) + ` ... [truncated, ${value.length - maxLength} more chars]`;
  };
  
  /**
   * Формирует объект с данными для логирования
   * @param data Данные запроса или ответа
   * @returns Данные для логирования
   */
  const prepareLogData = (data: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = { ...data };
    
    // Маскируем чувствительные данные если нужно
    if (maskSensitiveData) {
      if (includeHeaders && result.headers) {
        result.headers = maskSensitive(result.headers, sensitiveKeys);
      }
      
      if (result.body) {
        result.body = maskSensitive(result.body, sensitiveKeys);
      }
    }
    
    // Ограничиваем длину для больших объектов
    if (result.body && logRequestBody) {
      result.body = truncate(result.body, truncateLength);
    } else if (!logRequestBody) {
      delete result.body;
    }
    
    if (result.data && logResponseBody) {
      result.data = truncate(result.data, truncateLength);
    } else if (!logResponseBody) {
      delete result.data;
    }
    
    // Удаляем заголовки если не нужны
    if (!includeHeaders) {
      delete result.headers;
    }
    
    return result;
  };
  
  /**
   * Логирует сообщение с указанным уровнем
   * @param level Уровень логирования
   * @param message Сообщение
   * @param data Дополнительные данные
   */
  const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void => {
    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
    
    // Проверяем, нужно ли логировать с указанным уровнем
    if (logLevels[level] < logLevels[logLevel]) return;
    
    switch (level) {
      case 'debug':
        apiLogger.debug(message, data);
        break;
      case 'info':
        apiLogger.info(message, data);
        break;
      case 'warn':
        apiLogger.warn(message, data);
        break;
      case 'error':
        apiLogger.error(message, data);
        break;
    }
  };
  
  return {
    options: {
      name: 'logger-middleware',
      priority: 900, // Высокий приоритет для логирования
    },
    
    // Обработка запроса
    request: async (request, options, context) => {
      const { endpointName } = context;
      
      log('info', `🚀 ${endpointName}: ${request.method} ${request.path}`, prepareLogData({
        query: request.query,
        headers: options.headers,
        body: request.body,
      }));
      
      return { request, options };
    },
    
    // Обработка ответа
    response: async (result, context) => {
      const { endpointName, duration, fromCache } = context;
      
      if (fromCache) {
        log('info', `📦 ${endpointName}: Response from cache in ${duration}ms`, prepareLogData({
          status: result.status,
          data: result.data,
        }));
      } else {
        log('info', `✅ ${endpointName}: Response ${result.status} in ${duration}ms`, prepareLogData({
          status: result.status,
          headers: result.headers,
          data: result.data,
        }));
      }
      
      return result;
    },
    
    // Обработка ошибки
    error: async (error, context) => {
      const { endpointName, duration } = context;
      
      log('error', `❌ ${endpointName}: Error in ${duration}ms`, {
        error: error.message,
        stack: error.stack,
      });
      
      return error;
    },
    
    // Обработка событий
    onEvent: async (eventType, eventData) => {
      switch (eventType) {
        case ApiEventType.CACHE_HIT:
          log('debug', `📦 Cache hit: ${eventData.endpointName}`, {
            cacheKey: eventData.cacheKey,
          });
          break;
          
        case ApiEventType.CACHE_MISS:
          log('debug', `🔍 Cache miss: ${eventData.endpointName}`, {
            cacheKey: eventData.cacheKey,
          });
          break;
          
        case ApiEventType.CACHE_SET:
          log('debug', `💾 Cache set: ${eventData.endpointName}`, {
            cacheKey: eventData.cacheKey,
          });
          break;
          
        case ApiEventType.CACHE_INVALIDATE:
          log('debug', `🗑️ Cache invalidate`, {
            tags: eventData.tags,
            count: eventData.invalidatedCount,
          });
          break;
          
        case ApiEventType.REQUEST_CANCEL:
          log('info', `🛑 Request canceled: ${eventData.endpointName}`, {
            reason: eventData.reason,
          });
          break;
      }
    },
  };
}
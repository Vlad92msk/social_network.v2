import { EnhancedApiMiddleware } from '../types/api-middleware.interface';
import { RequestDefinition, RequestOptions } from '../types/api.interface';

/**
 * Опции middleware управления кэшем
 */
export interface CacheControlMiddlewareOptions {
  /** Список эндпоинтов для кэширования */
  cacheEndpoints?: string[];
  /** Список эндпоинтов для исключения из кэша */
  noCacheEndpoints?: string[];
  /** Теги для кэширования по эндпоинтам */
  endpointTags?: Record<string, string[]>;
  /** Время жизни кэша для эндпоинтов (в миллисекундах) */
  endpointTTL?: Record<string, number>;
  /** Заголовки, которые нужно добавить в ключ кэша */
  cacheableHeaderKeys?: string[];
  /** Игнорировать query-параметры при формировании ключа кэша */
  ignoreQueryParams?: boolean;
  /** Проверять заголовок Cache-Control */
  respectCacheHeader?: boolean;
}

/**
 * Создает middleware для управления кэшированием
 * @param options Опции управления кэшем
 * @returns Middleware управления кэшем
 */
export function createCacheControlMiddleware(
  options: CacheControlMiddlewareOptions = {}
): EnhancedApiMiddleware {
  const {
    cacheEndpoints = [],
    noCacheEndpoints = [],
    endpointTags = {},
    endpointTTL = {},
    cacheableHeaderKeys = [],
    ignoreQueryParams = false,
    respectCacheHeader = true,
  } = options;
  
  /**
   * Проверяет, нужно ли кэшировать запрос
   * @param endpointName Имя эндпоинта
   * @param request Запрос
   * @returns true если нужно кэшировать
   */
  const shouldCache = (endpointName: string, request: RequestDefinition): boolean => {
    // Проверяем исключения
    if (noCacheEndpoints.includes(endpointName)) {
      return false;
    }
    
    // Проверяем список разрешенных эндпоинтов
    if (cacheEndpoints.length > 0 && !cacheEndpoints.includes(endpointName)) {
      return false;
    }
    
    // Кэшируем только GET запросы по умолчанию
    return request.method === 'GET';
  };
  
  /**
   * Применяет настройки кэша к запросу
   * @param request Запрос
   * @param options Опции запроса
   * @param context Контекст middleware
   * @returns Модифицированные запрос и опции
   */
  const applyCacheSettings = (
    request: RequestDefinition,
    options: RequestOptions,
    context: { endpointName: string }
  ): { request: RequestDefinition, options: RequestOptions } => {
    const { endpointName } = context;
    
    // Проверяем, нужно ли кэшировать
    const shouldCacheRequest = shouldCache(endpointName, request);
    
    // Создаем копию опций
    const modifiedOptions: RequestOptions = { ...options };
    
    // Если нужно кэшировать
    if (shouldCacheRequest) {
      // Включаем кэширование
      modifiedOptions.enableCache = true;
      
      // Добавляем заголовки для кэша
      if (cacheableHeaderKeys.length > 0) {
        modifiedOptions.cacheableHeaderKeys = [
          ...(modifiedOptions.cacheableHeaderKeys || []),
          ...cacheableHeaderKeys,
        ];
      }
    } else {
      // Отключаем кэширование
      modifiedOptions.disableCache = true;
    }
    
    // Создаем копию запроса для модификации
    const modifiedRequest: RequestDefinition = { ...request };
    
    // Если нужно игнорировать query-параметры
    if (ignoreQueryParams && shouldCacheRequest) {
      modifiedRequest.query = {};
    }
    
    // Проверяем заголовок Cache-Control
    if (respectCacheHeader && request.headers && 'cache-control' in request.headers) {
      const cacheControl = request.headers['cache-control'] || '';
      
      // Если указан no-cache, отключаем кэширование
      if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        modifiedOptions.disableCache = true;
        modifiedOptions.enableCache = false;
      }
    }
    
    return { request: modifiedRequest, options: modifiedOptions };
  };
  
  return {
    options: {
      name: 'cache-control-middleware',
      priority: 700, // Высокий приоритет для управления кэшем
    },
    
    // Обработка запроса
    request: async (request, options, context) => {
      return applyCacheSettings(request, options, context);
    },
    
    // Обработка ответа
    response: async (result, context) => {
      // Если ответ не из кэша и есть теги для эндпоинта, добавляем их в метаданные
      if (!context.fromCache && endpointTags[context.endpointName]) {
        // Обновляем метаданные с тегами
        return {
          ...result,
          metadata: {
            ...(result.metadata || {}),
            tags: endpointTags[context.endpointName],
          },
        };
      }
      
      return result;
    },
  };
}
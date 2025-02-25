import { EnhancedApiMiddleware, MiddlewareRequestContext } from '../types/api-middleware.interface';
import { RequestDefinition, RequestOptions } from '../types/api.interface';

/**
 * Тип функции для получения токена авторизации
 */
export type TokenProvider = () => string | Promise<string>;

/**
 * Опции middleware авторизации
 */
export interface AuthMiddlewareOptions {
  /** Префикс токена (например, 'Bearer ') */
  tokenPrefix?: string;
  /** Заголовок для авторизации */
  headerName?: string;
  /** Пропускать авторизацию для этих путей */
  skipPaths?: (string | RegExp)[];
  /** Только для этих методов */
  onlyMethods?: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  /** Обработчик получения токена */
  tokenRefreshHandler?: () => Promise<string>;
}

/**
 * Создает middleware для добавления авторизации в запросы
 * @param tokenProvider Функция-поставщик токена
 * @param options Дополнительные опции
 * @returns Middleware авторизации
 */
export function createAuthMiddleware(
  tokenProvider: TokenProvider,
  options: AuthMiddlewareOptions = {}
): EnhancedApiMiddleware {
  const {
    tokenPrefix = 'Bearer ',
    headerName = 'Authorization',
    skipPaths = [],
    onlyMethods,
  } = options;
  
  /**
   * Проверяет, нужно ли пропустить авторизацию для запроса
   * @param request Запрос
   * @returns true если нужно пропустить
   */
  const shouldSkip = (request: RequestDefinition): boolean => {
    // Проверяем метод
    if (onlyMethods && !onlyMethods.includes(request.method as any)) {
      return true;
    }
    
    // Проверяем путь
    for (const pattern of skipPaths) {
      if (typeof pattern === 'string') {
        if (request.path === pattern || request.path.startsWith(pattern)) {
          return true;
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(request.path)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  /**
   * Добавляет токен в заголовки запроса
   * @param request Запрос
   * @param options Опции запроса
   * @param context Контекст middleware
   * @returns Модифицированные запрос и опции
   */
  const addToken = async (
    request: RequestDefinition,
    options: RequestOptions,
    context: MiddlewareRequestContext
  ): Promise<{ request: RequestDefinition, options: RequestOptions }> => {
    if (shouldSkip(request)) {
      return { request, options };
    }
    
    try {
      // Получаем токен
      const token = await Promise.resolve(tokenProvider());
      
      if (!token) {
        return { request, options };
      }
      
      // Создаем копию заголовков
      const headers = new Headers(options.headers || {});
      
      // Добавляем токен
      headers.set(headerName, token.startsWith(tokenPrefix) ? token : `${tokenPrefix}${token}`);
      
      // Возвращаем модифицированные опции
      return {
        request,
        options: {
          ...options,
          headers: Object.fromEntries(headers.entries()),
        },
      };
    } catch (error) {
      console.error('Ошибка в auth middleware:', error);
      return { request, options };
    }
  };
  
  return {
    options: {
      name: 'auth-middleware',
      priority: 800, // Высокий приоритет для авторизации
    },
    
    request: addToken,
  };
}
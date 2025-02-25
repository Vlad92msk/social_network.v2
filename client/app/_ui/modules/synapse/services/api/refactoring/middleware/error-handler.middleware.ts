import { EnhancedApiMiddleware, MiddlewareErrorContext } from '../types/api-middleware.interface';
import { QueryResult } from '../types/api.interface';
import { apiLogger } from '../utils/api-helpers';

/**
 * Обработчик ошибок для middleware
 */
export type ErrorHandler = (
  error: Error,
  context: MiddlewareErrorContext
) => Error | QueryResult | Promise<Error | QueryResult>;

/**
 * Опции middleware обработки ошибок
 */
export interface ErrorHandlerMiddlewareOptions {
  /** Обработчики ошибок по статусам */
  statusHandlers?: Record<number, ErrorHandler>;
  /** Обработчики ошибок по имени ошибки */
  nameHandlers?: Record<string, ErrorHandler>;
  /** Обработчики ошибок по эндпоинтам */
  endpointHandlers?: Record<string, ErrorHandler>;
  /** Глобальный обработчик ошибок */
  defaultHandler?: ErrorHandler;
  /** Преобразовывать сетевые ошибки в стандартный формат */
  standardizeErrors?: boolean;
}

/**
 * Создает middleware для обработки ошибок
 * @param options Опции обработки ошибок
 * @returns Middleware обработки ошибок
 */
export function createErrorHandlerMiddleware(
  options: ErrorHandlerMiddlewareOptions = {}
): EnhancedApiMiddleware {
  const {
    statusHandlers = {},
    nameHandlers = {},
    endpointHandlers = {},
    defaultHandler,
    standardizeErrors = true,
  } = options;
  
  /**
   * Стандартизирует ошибку в общий формат
   * @param error Исходная ошибка
   * @returns Стандартизированная ошибка
   */
  const standardizeError = (error: any): Error => {
    if (error instanceof Error) {
      return error;
    }
    
    // Если это не Error, создаем новый объект Error
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (error && typeof error === 'object') {
      // Пытаемся извлечь сообщение из объекта
      const message = error.message || error.error || JSON.stringify(error);
      
      const standardError = new Error(message);
      
      // Копируем свойства из исходной ошибки
      Object.assign(standardError, error);
      
      return standardError;
    }
    
    return new Error(String(error));
  };
  
  return {
    options: {
      name: 'error-handler-middleware',
      priority: 600, // Выше среднего приоритета
    },
    
    // Обработка ошибок
    error: async (error, context) => {
      let standardizedError = error;
      
      // Стандартизируем ошибку если нужно
      if (standardizeErrors) {
        standardizedError = standardizeError(error);
      }
      
      try {
        // Сначала пробуем обработчик для эндпоинта
        if (context.endpointName && endpointHandlers[context.endpointName]) {
          return await Promise.resolve(
            endpointHandlers[context.endpointName](standardizedError, context)
          );
        }
        
        // Пробуем обработчик по имени ошибки
        if (standardizedError.name && nameHandlers[standardizedError.name]) {
          return await Promise.resolve(
            nameHandlers[standardizedError.name](standardizedError, context)
          );
        }
        
        // Пробуем обработчик по статусу
        if ('status' in context && typeof context.status === 'number' && statusHandlers[context.status]) {
          return await Promise.resolve(
            statusHandlers[context.status](standardizedError, context)
          );
        }
        
        // Если ни один из специфичных обработчиков не подошел, используем стандартный
        if (defaultHandler) {
          return await Promise.resolve(
            defaultHandler(standardizedError, context)
          );
        }
      } catch (handlerError) {
        // Если обработчик ошибок вызвал исключение, логируем его
        apiLogger.error(
          `Ошибка в обработчике ошибок для ${context.endpointName}:`,
          handlerError
        );
      }
      
      // Если нет подходящего обработчика или произошла ошибка в обработчике, возвращаем стандартизированную ошибку
      return standardizedError;
    },
  };
}
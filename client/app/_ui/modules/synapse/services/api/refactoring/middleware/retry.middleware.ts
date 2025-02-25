import { EnhancedApiMiddleware, MiddlewareErrorContext } from '../types/api-middleware.interface';
import { apiLogger } from '../utils/api-helpers';

/**
 * Опции middleware повторных попыток
 */
export interface RetryMiddlewareOptions {
  /** Максимальное количество попыток */
  maxRetries?: number;
  /** Базовая задержка между попытками (мс) */
  baseDelay?: number;
  /** Использовать экспоненциальное увеличение задержки */
  useExponentialBackoff?: boolean;
  /** Максимальная задержка (мс) */
  maxDelay?: number;
  /** Коды ошибок для повторных попыток */
  retryStatusCodes?: number[];
  /** Имена ошибок для повторных попыток */
  retryErrorNames?: string[];
  /** Функция для определения, нужна ли повторная попытка */
  shouldRetry?: (error: Error, attempt: number, context: MiddlewareErrorContext) => boolean | Promise<boolean>;
  /** Функция для вычисления задержки */
  calculateDelay?: (attempt: number, options: RetryMiddlewareOptions) => number;
}

/**
 * Создает middleware для повторных попыток при ошибках
 * @param options Опции повторных попыток
 * @returns Middleware повторных попыток
 */
export function createRetryMiddleware(options: RetryMiddlewareOptions = {}): EnhancedApiMiddleware {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    useExponentialBackoff = true,
    maxDelay = 30000,
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
    retryErrorNames = ['TimeoutError', 'NetworkError', 'AbortError'],
  } = options;
  
  /**
   * По умолчанию вычисляет задержку на основе номера попытки
   * @param attempt Номер попытки (начиная с 1)
   * @returns Задержка в миллисекундах
   */
  const defaultCalculateDelay = (attempt: number): number => {
    if (useExponentialBackoff) {
      // Экспоненциальное увеличение задержки: baseDelay * 2^(attempt-1)
      // Пример: 1000 * 2^0 = 1000ms, 1000 * 2^1 = 2000ms, 1000 * 2^2 = 4000ms
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      // Добавляем случайное "дрожание" (jitter) до 25% для предотвращения "эффекта стампеда"
      const jitter = Math.random() * 0.25 + 0.75;
      return Math.min(delay * jitter, maxDelay);
    } else {
      // Линейное увеличение: baseDelay * attempt
      return Math.min(baseDelay * attempt, maxDelay);
    }
  };
  
  /**
   * По умолчанию определяет, нужна ли повторная попытка
   * @param error Ошибка
   * @param attempt Номер попытки
   * @param context Контекст ошибки
   * @returns true если нужна повторная попытка
   */
  const defaultShouldRetry = (error: Error, attempt: number, context: MiddlewareErrorContext): boolean => {
    // Проверяем, не превышено ли максимальное количество попыток
    if (attempt >= maxRetries) {
      return false;
    }
    
    // Проверяем код ошибки, если доступен
    if ('status' in context && typeof context.status === 'number') {
      if (retryStatusCodes.includes(context.status)) {
        return true;
      }
    }
    
    // Проверяем имя ошибки
    if (retryErrorNames.includes(error.name)) {
      return true;
    }
    
    // Проверяем сообщение ошибки на наличие ключевых слов
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('socket') ||
      errorMessage.includes('превышено время ожидания')
    );
  };
  
  // Используем функции из опций или значения по умолчанию
  const calculateDelay = options.calculateDelay || defaultCalculateDelay;
  const shouldRetry = options.shouldRetry || defaultShouldRetry;
  
  // Хранилище для отслеживания попыток
  const retryAttempts = new Map<string, number>();
  
  // Генерация уникального идентификатора запроса
  const getRequestId = (context: MiddlewareErrorContext): string => {
    const { endpointName, params } = context;
    return `${endpointName}:${JSON.stringify(params)}:${Date.now()}`;
  };
  
  return {
    options: {
      name: 'retry-middleware',
      priority: 500, // Средний приоритет
    },
    
    // Обработка ошибок с повторными попытками
    error: async (error, context) => {
      const requestId = getRequestId(context);
      
      // Получаем текущую попытку или начинаем с 1
      const attempt = (retryAttempts.get(requestId) || 0) + 1;
      retryAttempts.set(requestId, attempt);
      
      // Проверяем, нужно ли делать повторную попытку
      const shouldRetryRequest = await Promise.resolve(shouldRetry(error, attempt, context));
      
      if (shouldRetryRequest) {
        // Вычисляем задержку
        const delay = calculateDelay(attempt, {
          maxRetries,
          baseDelay,
          useExponentialBackoff,
          maxDelay,
          retryStatusCodes,
          retryErrorNames,
        });
        
        // Логируем информацию о повторной попытке
        apiLogger.warn(
          `Повторная попытка #${attempt} для ${context.endpointName} через ${delay}мс`,
          { error: error.message }
        );
        
        // Ожидаем задержку
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Делаем повторный запрос
        try {
          const result = await context.originalOptions?.retry?.(context.params, context.originalOptions);
          
          // Если повторный запрос успешен, очищаем счетчик попыток
          retryAttempts.delete(requestId);
          
          return result;
        } catch (retryError) {
          // Если повторный запрос также неудачен, возвращаем ошибку
          apiLogger.error(
            `Повторная попытка #${attempt} для ${context.endpointName} не удалась`,
            { error: retryError }
          );
          
          // Очищаем счетчик попыток, если достигнуто максимальное количество
          if (attempt >= maxRetries) {
            retryAttempts.delete(requestId);
          }
          
          return retryError instanceof Error ? retryError : new Error(String(retryError));
        }
      }
      
      // Если не нужно делать повторную попытку, очищаем счетчик и возвращаем ошибку
      retryAttempts.delete(requestId);
      return error;
    },
  };
}
import { ApiClient } from '../components/api-client'
import { RequestOptions } from './api.interface'
import { ApiEventData, ApiEventType } from './api-events.interface'

/**
 * Контекст запроса для middleware
 */
export interface ApiMiddlewareContext {
  /** Имя эндпоинта */
  endpointName: string
  /** Параметры запроса */
  params: any
  /** Опции запроса */
  options: RequestOptions
  /** Уникальный ID запроса */
  requestId: string
  /** Оригинальная функция fetch */
  originalFetch: (...args: any[]) => Promise<any>
  /** Ссылка на клиент API */
  client: ApiClient<any>
}

/**
 * Базовый middleware для перехвата запросов
 */
export interface ApiMiddleware {
  /** Обработка перед запросом */
  before?: (context: ApiMiddlewareContext) => Promise<void> | void
  /** Обработка после успешного запроса */
  after?: (context: ApiMiddlewareContext & { result: any }) => Promise<any> | any
  /** Обработка при ошибке запроса */
  onError?: (context: ApiMiddlewareContext & { error: Error }) => Promise<void> | void
}

/**
 * Функция следующего шага в цепочке middleware
 */
export type ApiNextFunction = (context: ApiMiddlewareContext) => Promise<any>

/**
 * API для взаимодействия middleware с клиентом
 */
export interface ApiMiddlewareAPI {
  /** Отправка запроса через всю цепочку middleware заново */
  execute: (context: ApiMiddlewareContext) => Promise<any>

  /** Получение глобальных опций */
  getGlobalOptions: () => RequestOptions

  /** Обновление опций запроса */
  updateOptions: (context: ApiMiddlewareContext, newOptions: Partial<RequestOptions>) => void

  /** Генерация события */
  emitEvent: (eventType: ApiEventType, data: ApiEventData) => void
}

/**
 * Расширенное определение API Middleware с поддержкой цепочки вызовов
 */
export interface EnhancedApiMiddleware extends ApiMiddleware {
  /** Имя middleware для идентификации */
  name: string

  /** Функция для обработки запросов в цепочке middleware */
  process?: (api: ApiMiddlewareAPI) => (next: ApiNextFunction) => (context: ApiMiddlewareContext) => Promise<any>

  /** Функция установки, вызывается при регистрации middleware */
  setup?: (api: ApiMiddlewareAPI) => void

  /** Функция очистки при удалении или обновлении middleware */
  cleanup?: () => Promise<void> | void
}

import { ApiEventData, ApiEventType } from '../types/api-events.interface'
import { Unsubscribe } from '../types/api.interface'

/**
 * Централизованный менеджер событий с типизацией
 */
export class EventBus {
  /** Обработчики событий по типу */
  private eventHandlers: Map<ApiEventType, Set<(data: ApiEventData) => void>> = new Map()

  /** Обработчики по эндпоинту */
  private endpointHandlers: Map<string, Set<(data: ApiEventData) => void>> = new Map()

  /** Обработчики по тегу */
  private tagHandlers: Map<string, Set<(data: ApiEventData) => void>> = new Map()

  /**
   * Подписка на события по типу
   * @param eventType Тип события
   * @param handler Обработчик события
   * @returns Функция отписки
   */
  public subscribe<E extends ApiEventType>(
    eventType: E,
    handler: (data: Extract<ApiEventData, { type: E }>) => void,
  ): Unsubscribe {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }

    const handlers = this.eventHandlers.get(eventType)!
    handlers.add(handler as (data: ApiEventData) => void)

    return () => {
      handlers.delete(handler as (data: ApiEventData) => void)
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType)
      }
    }
  }

  /**
   * Подписка на события конкретного эндпоинта
   * @param endpointName Имя эндпоинта
   * @param handler Обработчик события
   * @returns Функция отписки
   */
  public subscribeEndpoint(
    endpointName: string,
    handler: (data: ApiEventData) => void,
  ): Unsubscribe {
    if (!this.endpointHandlers.has(endpointName)) {
      this.endpointHandlers.set(endpointName, new Set())
    }

    const handlers = this.endpointHandlers.get(endpointName)!
    handlers.add(handler)

    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.endpointHandlers.delete(endpointName)
      }
    }
  }

  /**
   * Подписка на события по тегу
   * @param tag Тег для фильтрации событий
   * @param handler Обработчик события
   * @returns Функция отписки
   */
  public subscribeTag(
    tag: string,
    handler: (data: ApiEventData) => void,
  ): Unsubscribe {
    if (!this.tagHandlers.has(tag)) {
      this.tagHandlers.set(tag, new Set())
    }

    const handlers = this.tagHandlers.get(tag)!
    handlers.add(handler)

    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.tagHandlers.delete(tag)
      }
    }
  }

  /**
   * Отправка события
   * @param eventType Тип события
   * @param data Данные события
   */
  public emit(eventType: ApiEventType, data: ApiEventData): void {
    // Гарантируем, что данные содержат тип события
    const eventData = { ...data, type: eventType }

    // Оповещаем обработчики по типу события
    const typeHandlers = this.eventHandlers.get(eventType)
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        try {
          handler(eventData)
        } catch (error) {
          console.error(`[API] Ошибка в обработчике события ${eventType}:`, error)
        }
      })
    }

    // Оповещаем обработчики по эндпоинту
    if ('endpointName' in eventData) {
      const endpointHandlers = this.endpointHandlers.get(eventData.endpointName)
      if (endpointHandlers) {
        endpointHandlers.forEach((handler) => {
          try {
            handler(eventData)
          } catch (error) {
            console.error(`[API] Ошибка в обработчике эндпоинта ${eventData.endpointName}:`, error)
          }
        })
      }
    }

    // Оповещаем обработчики по тегам
    if ('context' in eventData && eventData.context && 'tag' in eventData.context) {
      const tag = eventData.context.tag as string
      const tagHandlers = this.tagHandlers.get(tag)

      if (tagHandlers) {
        tagHandlers.forEach((handler) => {
          try {
            handler(eventData)
          } catch (error) {
            console.error(`[API] Ошибка в обработчике тега ${tag}:`, error)
          }
        })
      }
    }
  }

  /**
   * Удаляет все обработчики
   */
  public destroy(): void {
    this.eventHandlers.clear()
    this.endpointHandlers.clear()
    this.tagHandlers.clear()
  }
}

import { EventEmitter } from 'events'
import { apiLogger, Unsubscribe } from '..'
import { ApiEventData, ApiEventType } from '../types/api-events.interface'

/**
 * Менеджер событий для API клиента
 * Отвечает за регистрацию и вызов событий
 */
export class ApiSubscriber extends EventEmitter {
  /**
   * Создает новый экземпляр менеджера событий
   */
  constructor() {
    super()
    // Установка разумного значения максимального количества слушателей
    this.setMaxListeners(50)
  }

  /**
   * Подписка на события конкретного эндпоинта
   * @param endpointName Имя эндпоинта
   * @param listener Обработчик события
   * @returns Функция для отписки
   */
  public subscribeEndpoint<T extends ApiEventData>(
    endpointName: string,
    listener: (data: T) => void,
  ): Unsubscribe {
    const eventName = `endpoint:${endpointName}`

    // Приведение типов для EventEmitter
    const typedListener = listener as unknown as (data: any) => void

    this.on(eventName, typedListener)
    return () => {
      this.off(eventName, typedListener)
    }
  }

  /**
   * Подписка на определённый тип события для всех эндпоинтов
   * @param eventType Тип события
   * @param listener Обработчик события
   * @returns Функция для отписки
   */
  public subscribeEvent<E extends ApiEventType>(
    eventType: E,
    listener: (data: Extract<ApiEventData, { type: E }>) => void,
  ): Unsubscribe {
    // Приведение типов для EventEmitter
    const typedListener = listener as unknown as (data: any) => void

    this.on(eventType, typedListener)
    return () => {
      this.off(eventType, typedListener)
    }
  }

  /**
   * Подписка на события группы эндпоинтов по тегу
   * @param tag Тег группы эндпоинтов
   * @param listener Обработчик события
   * @returns Функция для отписки
   */
  public subscribeTag(
    tag: string,
    listener: (data: ApiEventData) => void,
  ): Unsubscribe {
    const eventName = `tag:${tag}`
    this.on(eventName, listener)
    return () => {
      this.off(eventName, listener)
    }
  }

  /**
   * Генерирует событие
   * @param eventType Тип события
   * @param data Данные события
   */
  public emit(eventType: string, data: ApiEventData): boolean {
    try {
      return super.emit(eventType, data)
    } catch (error) {
      apiLogger.error(`Ошибка при генерации события ${eventType}`, error)
      return false
    }
  }

  /**
   * Генерирует группу связанных событий (общее событие, событие эндпоинта и события тегов)
   * @param mainEventType Основной тип события
   * @param data Данные события
   * @param contextType Тип события в контексте
   * @param tags Теги, для которых нужно сгенерировать события
   */
  public emitGroupEvents(
    mainEventType: ApiEventType,
    data: ApiEventData,
    contextType: ApiEventType,
    tags?: string[],
  ): void {
    // Основное событие по типу
    this.emit(mainEventType, data)

    // Событие для конкретного эндпоинта
    this.emit(`endpoint:${data.endpointName}`, {
      ...data,
      context: { type: contextType },
    })

    // События для тегов
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        this.emit(`tag:${tag}`, {
          ...data,
          context: { type: contextType, tag },
        })
      }
    }
  }

  /**
   * Очищает все обработчики событий
   */
  public destroy(): void {
    this.removeAllListeners()
  }
}

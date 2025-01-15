import { Event, EventBusConfig, EventBusSegment, IEventBus, Subscriber } from './event-bus.interface'

export class SegmentedEventBus implements IEventBus {
  // Хранит все сегменты с их подписчиками
  private segments: Map<string, EventBusSegment> = new Map()

  /**
   * Создает новый сегмент для группировки определенных типов событий
   * @param name - Уникальное имя сегмента (например, 'logger', 'users', 'notifications')
   * @param config - Конфигурация сегмента (приоритет, фильтры)
   */
  public createSegment(name: string, config: EventBusConfig = {}): void {
    if (this.segments.has(name)) {
      throw new Error(`Segment "${name}" already exists`)
    }

    this.segments.set(name, {
      name,
      config: {
        priority: config.priority ?? 0,
        filters: config.filters ?? [],
      },
      subscribers: new Set(),
    })
  }

  /**
   * Публикует событие во все соответствующие сегменты
   * События обрабатываются в порядке приоритета сегментов
   * @param event - Событие для публикации
   */
  public async publish(event: Event): Promise<void> {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
    }

    // Получаем отсортированные по приоритету сегменты
    const sortedSegments = Array.from(this.segments.values())
      .sort((a, b) => (b.config.priority ?? 0) - (a.config.priority ?? 0))

    // Обрабатываем все сегменты параллельно
    await Promise.all(
      sortedSegments.map(async (segment) => {
        // Проверяем фильтры
        if (segment.config.filters?.some((filter) => !filter(enrichedEvent))) {
          return
        }

        const subscribers = Array.from(segment.subscribers)

        // Обрабатываем всех подписчиков сегмента параллельно
        await Promise.all(
          subscribers.map((subscriber) => Promise.resolve(subscriber(enrichedEvent)).catch((error) => {
            console.error(
              `Error in event subscriber for segment "${segment.name}":`,
              error,
            )
          })),
        )
      }),
    )
  }

  /**
   * Добавляет подписчика к определенному сегменту
   * @param segmentName - Имя сегмента для подписки
   * @param subscriber - Функция-обработчик событий
   * @returns Функция для отписки
   */
  public subscribe(segmentName: string, subscriber: Subscriber): () => void {
    const segment = this.segments.get(segmentName)
    if (!segment) {
      throw new Error(`Segment "${segmentName}" not found`)
    }

    segment.subscribers.add(subscriber)

    // Возвращаем функцию отписки
    return () => {
      segment.subscribers.delete(subscriber)
    }
  }

  public hasSegment(name: string): boolean {
    return this.segments.has(name)
  }

  public getSegment(name: string): EventBusSegment | undefined {
    return this.segments.get(name)
  }

  public removeSegment(name: string): boolean {
    return this.segments.delete(name)
  }
}

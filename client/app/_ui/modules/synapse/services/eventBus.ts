// services/eventBus.ts
import { Event, EventBusConfig, EventBusSegment, Subscriber } from '../types/core'

export class SegmentedEventBus {
  private segments: Map<string, EventBusSegment> = new Map()

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

  public async publish(event: Event): Promise<void> {
    // Добавляем timestamp если его нет
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
    }

    // Получаем отсортированные по приоритету сегменты
    const sortedSegments = Array.from(this.segments.values())
      .sort((a, b) => (b.config.priority ?? 0) - (a.config.priority ?? 0))

    // Публикуем событие во всех сегментах
    for (const segment of sortedSegments) {
      // Проверяем фильтры
      if (segment.config.filters?.some((filter) => !filter(enrichedEvent))) {
        continue
      }

      // Уведомляем подписчиков
      const subscribers = Array.from(segment.subscribers)
      await Promise.all(
        subscribers.map((subscriber) => Promise.resolve(subscriber(enrichedEvent))
          .catch((error) => {
            console.error('Error in event subscriber:', error)
          })),
      )
    }
  }

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

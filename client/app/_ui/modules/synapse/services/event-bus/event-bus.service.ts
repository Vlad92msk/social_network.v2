import { Event, EventBusConfig, EventBusHierarchyConfig, EventBusSegment, IEventBus, Subscriber } from './event-bus.interface'

export class SegmentedEventBus implements IEventBus {
  private segments: Map<string, EventBusSegment> = new Map()

  private parent?: IEventBus

  private children: Set<IEventBus> = new Set()

  private readonly namespace?: string

  private readonly propagateUp: boolean

  private readonly propagateDown: boolean

  constructor(config: EventBusHierarchyConfig = {}) {
    this.parent = config.parent
    this.namespace = config.namespace
    this.propagateUp = config.propagateUp ?? true
    this.propagateDown = config.propagateDown ?? true

    if (this.parent && this.parent instanceof SegmentedEventBus) {
      (this.parent as SegmentedEventBus).addChild(this)
    }
  }

  private addChild(child: IEventBus): void {
    this.children.add(child)
  }

  private removeChild(child: IEventBus): void {
    this.children.delete(child)
  }

  public createChild(config: EventBusHierarchyConfig = {}): IEventBus {
    return new SegmentedEventBus({
      ...config,
      parent: this,
    })
  }

  public getParent(): IEventBus | undefined {
    return this.parent
  }

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

  public async emit(event: Event): Promise<void> {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
      namespace: this.namespace,
    }

    // Обрабатываем локально
    await this.processLocalEvent(enrichedEvent)

    // Пробрасываем вверх к родителю
    if (this.propagateUp && this.parent) {
      await this.parent.emit(enrichedEvent)
    }

    // Пробрасываем вниз к детям
    if (this.propagateDown) {
      await Promise.all(
        Array.from(this.children).map((child) => child.emit(enrichedEvent)),
      )
    }
  }

  private async processLocalEvent(event: Event): Promise<void> {
    const sortedSegments = Array.from(this.segments.values())
      .sort((a, b) => (b.config.priority ?? 0) - (a.config.priority ?? 0))

    await Promise.all(
      sortedSegments.map(async (segment) => {
        if (segment.config.filters?.some((filter) => !filter(event))) {
          return
        }

        const subscribers = Array.from(segment.subscribers)
        await Promise.all(
          subscribers.map((subscriber) => Promise.resolve(subscriber(event)).catch((error) => {
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

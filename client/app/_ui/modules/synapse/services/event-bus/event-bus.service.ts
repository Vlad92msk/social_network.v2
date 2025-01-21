import {
  Event, EventBusConfig, EventBusHierarchyConfig, EventBusSegment, EventBusSegmentConfig, IEventBus, Subscriber,
} from './event-bus.interface'

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
   */
  public createSegment(config: EventBusSegmentConfig | string, oldConfig: EventBusConfig = {}): void {
    const segmentConfig = typeof config === 'string'
      ? {
        name: config,
        eventTypes: [],
        priority: oldConfig.priority ?? 0,
        filters: oldConfig.filters ?? [],
      }
      : config

    if (this.segments.has(segmentConfig.name)) {
      throw new Error(`Segment "${segmentConfig.name}" already exists`)
    }

    this.segments.set(segmentConfig.name, {
      name: segmentConfig.name,
      config: {
        name: segmentConfig.name,
        priority: segmentConfig.priority ?? 0,
        filters: segmentConfig.filters ?? [],
        eventTypes: segmentConfig.eventTypes ?? [],
      },
      subscribers: new Set(),
    })
  }

  public async emit(event: Event): Promise<void> {
    // Проверяем, что тип события поддерживается хотя бы одним сегментом
    const isSupported = Array.from(this.segments.values()).some((segment) => segment.config.eventTypes.includes(event.type))

    if (!isSupported) {
      console.warn(`Warning: Event type "${event.type}" is not registered in any segment`)
    }

    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
      namespace: this.namespace,
    }

    await this.processLocalEvent(enrichedEvent)

    if (this.propagateUp && this.parent) {
      await this.parent.emit(enrichedEvent)
    }

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
        // Проверяем eventTypes только если они определены
        if (segment.config.eventTypes?.length
          && !segment.config.eventTypes.includes(event.type)) {
          return
        }

        // Проверяем фильтры только если они определены
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
   */
  public subscribe(segmentName: string, subscriber: Subscriber): () => void {
    const segment = this.segments.get(segmentName)
    if (!segment) {
      throw new Error(`Segment "${segmentName}" not found`)
    }

    segment.subscribers.add(subscriber)
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

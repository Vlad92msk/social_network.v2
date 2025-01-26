export type EventType = string

export interface Event {
  type: EventType
  payload?: any
  metadata?: Record<string, any>
  timestamp?: number
  namespace?: string
}

export interface EventBusConfig {
  priority?: number
  filters?: Array<(event: Event) => boolean>
}

export interface EventBusSegmentConfig {
  name: string
  priority?: number
  eventTypes?: string[]
  filters?: Array<(event: Event) => boolean>
}

export interface Subscriber {
  (event: Event): void | Promise<void>
}

export interface EventBusHierarchyConfig {
  parent?: IEventBus
  propagateUp?: boolean // отправлять ли события родительской шине
  propagateDown?: boolean // отправлять ли события дочерним шинам
  namespace?: string // для группировки событий по принадлежности к модулю/компоненту системы
}

export interface EventBusSegment {
  name: string
  config: {
    name: string
    priority: number
    eventTypes: string[]
    filters: Array<(event: Event) => boolean>
  }
  subscribers: Set<Subscriber>
}

export interface IEventBus {
  createSegment(config: EventBusSegmentConfig | string, oldConfig?: EventBusConfig): void
  emit(event: Event): Promise<void>
  subscribe(segmentName: string, subscriber: Subscriber): VoidFunction
  hasSegment(name: string): boolean
  getSegment(name: string): EventBusSegment | undefined
  removeSegment(name: string): boolean
  createChild(config?: EventBusHierarchyConfig): IEventBus
  getParent(): IEventBus | undefined
}

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

// Базовый тип для конфигурации сегмента
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
  propagateUp?: boolean
  propagateDown?: boolean
  namespace?: string
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
  // Создание сегмента
  createSegment(config: EventBusSegmentConfig): void

  // Публикация события
  emit(event: Event): Promise<void>

  // Подписка на события в сегменте
  subscribe(segmentName: string, subscriber: Subscriber): VoidFunction

  // Проверка существования сегмента
  hasSegment(name: string): boolean

  // Получение сегмента
  getSegment(name: string): EventBusSegment | undefined

  // Удаление сегмента
  removeSegment(name: string): boolean

  createChild(config?: EventBusHierarchyConfig): IEventBus
  getParent(): IEventBus | undefined
}

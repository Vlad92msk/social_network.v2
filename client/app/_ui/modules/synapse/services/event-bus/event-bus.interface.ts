export interface Event {
  type: string
  payload?: any
  metadata?: Record<string, any>
  timestamp?: number
}

export interface EventBusConfig {
  priority?: number
  filters?: Array<(event: Event) => boolean>
}

export interface Subscriber {
  (event: Event): void | Promise<void>
}

export interface EventBusSegment {
  name: string
  config: EventBusConfig
  subscribers: Set<Subscriber>
}


export interface IEventBus {
  // Создание сегмента
  createSegment(name: string, config?: EventBusConfig): void;

  // Публикация события
  publish(event: Event): Promise<void>;

  // Подписка на события в сегменте
  subscribe(segmentName: string, subscriber: Subscriber): () => void;

  // Проверка существования сегмента
  hasSegment(name: string): boolean;

  // Получение сегмента
  getSegment(name: string): EventBusSegment | undefined;

  // Удаление сегмента
  removeSegment(name: string): boolean;
}

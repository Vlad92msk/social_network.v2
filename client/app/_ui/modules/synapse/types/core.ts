// types/core.ts
export interface Event {
  type: string;
  payload?: any;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface EventBusConfig {
  priority?: number;
  filters?: Array<(event: Event) => boolean>;
}

export interface Subscriber {
  (event: Event): void | Promise<void>;
}

export interface EventBusSegment {
  name: string;
  config: EventBusConfig;
  subscribers: Set<Subscriber>;
}

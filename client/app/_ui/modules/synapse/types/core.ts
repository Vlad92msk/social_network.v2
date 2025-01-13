// types/core.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: number;
}

export interface LogCollector {
  collect(entry: LogEntry): void;
}

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

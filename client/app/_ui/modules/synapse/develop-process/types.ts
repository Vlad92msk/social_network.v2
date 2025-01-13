// Core interfaces
interface Type<T = any> {
  new (...args: any[]): T;
}

interface ServiceIdentifier {
  toString(): string;
}

interface ServiceMetadata {
  id: ServiceIdentifier;
  dependencies: ServiceIdentifier[];
  singleton?: boolean;
  tags?: string[];
}

interface ServiceFactory<T = any> {
  (...args: any[]): T;
}

interface GlobalMiddleware {
  before?: (serviceId: ServiceIdentifier, ...args: any[]) => any[];
  after?: (serviceId: ServiceIdentifier, result: any) => any;
}

// Event Bus interfaces
interface Event {
  type: string;
  payload?: any;
  metadata?: Record<string, any>;
  timestamp?: number;
}

interface EventBusConfig {
  priority?: number;
  filters?: Array<(event: Event) => boolean>;
}

interface Subscriber {
  (event: Event): void | Promise<void>;
}

interface EventBusSegment {
  name: string;
  config: EventBusConfig;
  subscribers: Set<Subscriber>;
}

// Plugin interfaces
interface PluginMetadata {
  name: string;
  version: string;
  dependencies?: string[];
  conflicts?: string[];
  priority?: number;
}

interface Plugin {
  metadata: PluginMetadata;
  install(container: ServiceContainer): void | Promise<void>;
  uninstall?(container: ServiceContainer): void | Promise<void>;
}

interface GlobalPlugin extends Plugin {
  type: 'global';
}

interface ServicePlugin extends Plugin {
  type: 'service';
  service: ServiceIdentifier;
}

// Logger interfaces
interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: number;
}

interface LogCollector {
  collect(entry: LogEntry): void;
}

// Module interfaces
interface IModule {
  name: string;
  dependencies?: string[];
  initialize(): Promise<void>;
  destroy(): Promise<void>;
}

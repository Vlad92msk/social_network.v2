// Расширенный интерфейс для уровней логирования
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',    // Добавляем новый уровень для критических ошибок
  TRACE = 'trace'     // Добавляем уровень для детального отслеживания
}

// Метаданные лога
export interface LogMetadata {
  timestamp: number;
  correlationId?: string;
  source?: string;
  context?: Record<string, any>;
  environment?: string;
  [key: string]: any;
}

// Улучшенная структура записи лога
export interface LogEntry<T = any> {
  level: LogLevel;
  message: string;
  data?: T;
  metadata: LogMetadata;
  stackTrace?: string;
}

// Конфигурация для коллектора логов
export interface LogCollectorConfig {
  minLevel?: LogLevel;
  maxBatchSize?: number;
  flushInterval?: number;
  formatters?: LogFormatter[];
  errorHandler?: (error: Error) => void;
}

// Интерфейс для форматирования логов
export interface LogFormatter {
  format(entry: LogEntry): LogEntry | string;
}

// Расширенный интерфейс коллектора
export interface LogCollector {
  collect(entry: LogEntry): void | Promise<void>;
  flush?(): Promise<void>;
  configure?(config: LogCollectorConfig): void;
}

// Основной интерфейс логгера
export interface ILogger {
  // Основные методы логирования
  log(level: LogLevel, message: string, data?: any): void;
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  fatal?(message: string, data?: any): void;
  trace?(message: string, data?: any): void;

  // Управление коллекторами
  addCollector(collector: LogCollector): ILogger;
  removeCollector?(collector: LogCollector): boolean;
  clearCollectors?(): void;

  // Управление режимом отладки
  enableDebugMode(): void;
  disableDebugMode(): void;
  isDebugEnabled?(): boolean;

  // Дополнительные методы
  setContext?(context: Record<string, any>): void;
  getContext?(): Record<string, any>;
  withContext?(context: Record<string, any>): ILogger;

  // Управление форматированием
  addFormatter?(formatter: LogFormatter): ILogger;

  // Методы очистки и завершения работы
  flush?(): Promise<void>;
  destroy?(): Promise<void>;
}

// Конфигурация логгера
export interface LoggerConfig {
  defaultLevel?: LogLevel;
  collectors?: LogCollector[];
  formatters?: LogFormatter[];
  context?: Record<string, any>;
  debugMode?: boolean;
  metadata?: Partial<LogMetadata>;
}

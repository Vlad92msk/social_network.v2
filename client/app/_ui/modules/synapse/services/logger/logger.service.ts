import {
  ILogger, LogCollector, LogEntry, LogFormatter, LoggerConfig, LogLevel, LogMetadata,
} from './logger.interface'

export class Logger implements ILogger {
  private collectors: LogCollector[] = []

  private debugMode: boolean = false

  private context: Record<string, any> = {}

  private formatters: LogFormatter[] = []

  private defaultMetadata: Partial<LogMetadata> = {}

  constructor(config?: LoggerConfig) {
    if (config) {
      this.debugMode = config.debugMode ?? false
      this.collectors = config.collectors ?? []
      this.formatters = config.formatters ?? []
      this.context = config.context ?? {}
      this.defaultMetadata = config.metadata ?? {}
    }
  }

  public log(level: LogLevel, message: string, data?: any): void {
    if (level === LogLevel.DEBUG && !this.debugMode) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      data,
      metadata: {
        timestamp: Date.now(),
        ...this.defaultMetadata,
        context: { ...this.context },
      },
    }

    // Применяем форматтеры
    const formattedEntry = this.formatters.reduce(
      (entry, formatter) => {
        const result = formatter.format(entry)
        return typeof result === 'string' ? { ...entry, message: result } : result
      },
      entry,
    )

    // Отправляем в коллекторы
    this.collectors.forEach(async (collector) => {
      try {
        await Promise.resolve(collector.collect(formattedEntry))
      } catch (error) {
        console.error('Collector failed:', error)
      }
    })
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  public error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data)
  }

  public fatal(message: string, data?: any): void {
    this.log(LogLevel.FATAL, message, data)
  }

  public trace(message: string, data?: any): void {
    this.log(LogLevel.TRACE, message, data)
  }

  public addCollector(collector: LogCollector): ILogger {
    this.collectors.push(collector)
    return this
  }

  public removeCollector(collector: LogCollector): boolean {
    const index = this.collectors.indexOf(collector)
    if (index !== -1) {
      this.collectors.splice(index, 1)
      return true
    }
    return false
  }

  public clearCollectors(): void {
    this.collectors = []
  }

  public enableDebugMode(): void {
    this.debugMode = true
  }

  public disableDebugMode(): void {
    this.debugMode = false
  }

  public isDebugEnabled(): boolean {
    return this.debugMode
  }

  public setContext(context: Record<string, any>): void {
    this.context = { ...context }
  }

  public getContext(): Record<string, any> {
    return { ...this.context }
  }

  public withContext(context: Record<string, any>): ILogger {
    const newLogger = new Logger({
      debugMode: this.debugMode,
      collectors: [...this.collectors],
      formatters: [...this.formatters],
      context: { ...this.context, ...context },
      metadata: { ...this.defaultMetadata },
    })
    return newLogger
  }

  public addFormatter(formatter: LogFormatter): ILogger {
    this.formatters.push(formatter)
    return this
  }

  public async flush(): Promise<void> {
    await Promise.all(
      this.collectors
        .filter((collector) => collector.flush)
        .map((collector) => collector.flush!()),
    )
  }

  public async destroy(): Promise<void> {
    await this.flush()
    this.clearCollectors()
    this.formatters = []
    this.context = {}
  }
}

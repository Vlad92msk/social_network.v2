// services/logger.ts
import { SegmentedEventBus } from './eventBus'
import { LogCollector, LogEntry, LogLevel } from '../types/core'

export class Logger {
  private collectors: LogCollector[] = []

  private debugMode: boolean = false

  constructor(private readonly eventBus: SegmentedEventBus) {
    // Создаем сегмент для логов
    this.eventBus.createSegment('logger', {
      priority: 1000, // Высокий приоритет для логов
    })
  }

  public log(level: LogLevel, message: string, data?: any): void {
    if (level === LogLevel.DEBUG && !this.debugMode) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: Date.now(),
    }

    // Отправляем в коллекторы
    this.collectors.forEach((collector) => collector.collect(entry))

    // Публикуем событие
    this.eventBus.publish({
      type: 'logger:entry',
      payload: entry,
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

  public addCollector(collector: LogCollector): void {
    this.collectors.push(collector)
  }

  public enableDebugMode(): void {
    this.debugMode = true
  }

  public disableDebugMode(): void {
    this.debugMode = false
  }
}

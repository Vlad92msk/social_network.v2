// Просто пример

import { LogCollector, LogLevel } from '../logger.interface'
import { Logger } from '../logger.service'

// Создаем базовый логгер
const logger = new Logger()

// Коллектор для отправки логов в Sentry или другой сервис мониторинга
class SentryLogger implements LogCollector {
  async collect(entry: LogEntry): Promise<void> {
    if (entry.level === LogLevel.ERROR) {
      // Sentry.captureException(entry.data)
    }
  }
}

// Использование
logger.addCollector(new SentryLogger())

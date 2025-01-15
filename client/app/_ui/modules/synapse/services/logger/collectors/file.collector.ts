// Просто пример

import { LogCollector } from '../logger.interface'
import { Logger } from '../logger.service'

// Создаем базовый логгер
const logger = new Logger()

// Коллектор для записи в файл
class FileSystemLogger implements LogCollector {
  constructor(private filePath: string) {}

  async collect(entry: LogEntry): Promise<void> {
    const logString = `${entry.timestamp} [${entry.level}] ${entry.message}\n`
    // await fs.appendFile(this.filePath, logString)
  }
}

// Использование
logger.addCollector(new FileSystemLogger('app.log'))

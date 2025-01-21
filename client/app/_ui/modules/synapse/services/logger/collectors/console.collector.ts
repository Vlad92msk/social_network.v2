//Просто пример

// Коллектор для записи в консоль
import { Logger } from '@ui/modules/synapse/services/logger/logger.service'

// class ConsoleLogger implements LogCollector {
//   async collect(entry: LogEntry): Promise<void> {
//     console.log(`[${entry.level}] ${entry.message}`, entry.data)
//   }
// }
//
//
// // Создаем базовый логгер
// const logger = new Logger()
//
// // Использование
// logger.addCollector(new ConsoleLogger())

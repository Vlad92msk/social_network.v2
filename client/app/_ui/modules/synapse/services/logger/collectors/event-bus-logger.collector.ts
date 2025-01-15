import { SegmentedEventBus } from '../../event-bus/event-bus.service'
import { LogEntry } from '../logger.interface'
import { Logger } from '../logger.service'

export class EventBusLogger implements LogCollector {
  constructor(private eventBus: SegmentedEventBus) {
    this.eventBus.createSegment('logger', { priority: 1000 })
  }

  async collect(entry: LogEntry): Promise<void> {
    await this.eventBus.publish({
      type: 'logger:entry',
      payload: entry,
    })
  }
}

// Использование
// Создаем базовый логгер
const logger = new Logger()

// Где-то в проекте, где нужна интеграция с EventBus
const eventBus = new SegmentedEventBus()
const eventBusAdapter = new EventBusLogger(eventBus)
logger.addCollector(eventBusAdapter)

import { EventBusSegmentConfig } from '../../event-bus/event-bus.interface'
import { SegmentedEventBus } from '../../event-bus/event-bus.service'
import { LogCollector, LogEntry } from '../logger.interface'
import { Logger } from '../logger.service'

export const LoggerSegmentConfig: EventBusSegmentConfig = {
  name: 'logger',
  priority: 1000,
  eventTypes: ['logger:entry', 'logger:error'],
}

export class EventBusLogger implements LogCollector {
  constructor(private eventBus: SegmentedEventBus) {
    this.eventBus.createSegment(LoggerSegmentConfig)
  }

  async collect(entry: LogEntry): Promise<void> {
    await this.eventBus.emit({
      type: 'logger:entry',
      payload: entry,
      metadata: {
        timestamp: Date.now(),
        level: entry.level,
      },
    })
  }
}

// Где-то в проекте, где нужна интеграция с EventBus
const eventBus = new SegmentedEventBus()
const logger = new Logger().addCollector(new EventBusLogger(eventBus))

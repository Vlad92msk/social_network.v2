import { SegmentedEventBus } from '../../event-bus/event-bus.service'
import { LogCollector, LogEntry } from '../logger.interface'

export class EventBusLogger implements LogCollector {
  constructor(private eventBus: SegmentedEventBus) {}

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

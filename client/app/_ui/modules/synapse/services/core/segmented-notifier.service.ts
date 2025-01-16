import { SegmentedEventBus } from '../event-bus/event-bus.service'

export class SegmentedNotifier {
  constructor(
    private eventBus: SegmentedEventBus,
    private segment: 'store' | 'worker' | 'query',
  ) {
    this.eventBus.createSegment(segment, { priority: 1000 })
  }

  async notify<T>(type: string, payload: T): Promise<void> {
    await this.eventBus.emit({
      type: `${this.segment}:${type}`,
      payload,
    })
  }
}

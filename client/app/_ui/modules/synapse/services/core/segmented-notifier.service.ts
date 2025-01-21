import { EventBusSegmentConfig } from '../event-bus/event-bus.interface'
import { SegmentedEventBus } from '../event-bus/event-bus.service'

export const NotifierSegmentConfigs: Record<string, EventBusSegmentConfig> = {
  store: {
    name: 'store',
    priority: 1000,
    eventTypes: ['store:updated', 'store:error']
  },
  worker: {
    name: 'worker',
    priority: 1000,
    eventTypes: ['worker:message', 'worker:error']
  },
  query: {
    name: 'query',
    priority: 1000,
    eventTypes: ['query:success', 'query:error']
  }
};

export interface NotifierEvents {
  'store:updated': any;
  'store:error': Error;
  'worker:message': any;
  'worker:error': Error;
  'query:success': any;
  'query:error': Error;
}

export class SegmentedNotifier {
  constructor(
    private eventBus: SegmentedEventBus,
    private segment: keyof typeof NotifierSegmentConfigs,
  ) {
    this.eventBus.createSegment(NotifierSegmentConfigs[segment])
  }

  async notify<T>(type: string, payload: T): Promise<void> {
    const eventType = `${this.segment}:${type}` as keyof NotifierEvents

    await this.eventBus.emit({
      type: eventType,
      payload,
      metadata: {
        timestamp: Date.now(),
        segment: this.segment
      }
    })
  }

  // Добавим типизированные методы для удобства
  async notifySuccess(payload: any): Promise<void> {
    await this.notify('success', payload)
  }

  async notifyError(error: Error): Promise<void> {
    await this.notify('error', error)
  }
}

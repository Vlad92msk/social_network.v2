// Типы для BatchProcessor
import { StorageAction } from './middleware-module'

export interface BatchOptions<T> {
  batchSize?: number
  batchDelay?: number
  onBatch?: (items: T[]) => Promise<void>
  // Ключ для группировки элементов в разные очереди
  getSegmentKey?: (item: T) => string
  // Функция для определения можно ли элемент батчить
  shouldBatch?: (item: T) => boolean
  // Функция для объединения элементов с одинаковым ключом
  mergeItems?: (items: T[]) => T[]
}

export interface BatchQueueItem<T extends StorageAction> {
  action: T;
  baseOperation: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export class BatchProcessor<T extends StorageAction> {
  private readonly options: Required<BatchOptions<T>>

  private queues = new Map<string, BatchQueueItem<T>[]>()

  private timeouts = new Map<string, NodeJS.Timeout>()

  constructor(options: BatchOptions<T>) {
    this.options = {
      batchSize: options.batchSize ?? 10,
      batchDelay: options.batchDelay ?? 300,
      onBatch: options.onBatch ?? (async () => {}),
      getSegmentKey: options.getSegmentKey ?? (() => 'default'),
      shouldBatch: options.shouldBatch ?? (() => true),
      mergeItems: options.mergeItems ?? ((items) => items),
    }
  }

  public async add(action: T, baseOperation: () => Promise<any>): Promise<any> {
    if (!this.options.shouldBatch(action)) {
      return baseOperation()
    }

    return new Promise((resolve, reject) => {
      const segment = this.options.getSegmentKey(action)
      this.addToQueue(segment, { action, baseOperation, resolve, reject })
    })
  }

  private addToQueue(segment: string, queueItem: BatchQueueItem<T>): void {
    let queue = this.queues.get(segment)
    if (!queue) {
      queue = []
      this.queues.set(segment, queue)
    }

    queue.push(queueItem)
    this.clearSegmentTimeout(segment)

    if (queue.length >= this.options.batchSize) {
      this.processBatch(segment)
    } else {
      this.setSegmentTimeout(segment)
    }
  }

  private async processBatch(segment: string): Promise<void> {
    const queue = this.queues.get(segment)
    if (!queue?.length) return

    this.queues.delete(segment)
    this.clearSegmentTimeout(segment)

    try {
      // Объединяем похожие действия
      const mergedActions = this.options.mergeItems(queue.map((item) => item.action))

      // Выполняем операции последовательно
      for (let i = 0; i < mergedActions.length; i++) {
        const result = await queue[i].baseOperation()
        queue[i].resolve(result)
      }
    } catch (error) {
      queue.forEach(({ reject }) => reject(error))
    }
  }

  // ... остальные методы остаются теми же ...

  private clearSegmentTimeout(segment: string): void {
    const timeout = this.timeouts.get(segment)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(segment)
    }
  }

  private setSegmentTimeout(segment: string): void {
    const timeout = setTimeout(() => {
      this.processBatch(segment)
    }, this.options.batchDelay)

    this.timeouts.set(segment, timeout)
  }

  public async flush(): Promise<void> {
    const segments = Array.from(this.queues.keys())
    await Promise.all(segments.map((segment) => this.processBatch(segment)))
  }

  public clear(): void {
    this.queues.clear()
    Array.from(this.timeouts.values()).forEach(clearTimeout)
    this.timeouts.clear()
  }

  public getState(): { [segment: string]: number } {
    const state: { [segment: string]: number } = {}
    this.queues.forEach((queue, segment) => {
      state[segment] = queue.length
    })
    return state
  }
}

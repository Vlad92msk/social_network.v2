// Типы для BatchProcessor
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

export interface BatchQueueItem<T> {
  item: T
  resolve: (value: any) => void
  reject: (error: any) => void
}

export class BatchProcessor<T> {
  private readonly options: Required<BatchOptions<T>>

  private queues: Map<string, BatchQueueItem<T>[]> = new Map()

  private timeouts: Map<string, NodeJS.Timeout> = new Map()

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

  public async add(item: T): Promise<any> {
    // Если элемент не нужно батчить, обрабатываем сразу
    if (!this.options.shouldBatch(item)) {
      return this.processSingleItem(item)
    }

    return new Promise((resolve, reject) => {
      const segment = this.options.getSegmentKey(item)
      this.addToQueue(segment, { item, resolve, reject })
    })
  }

  private async processSingleItem(item: T): Promise<void> {
    return this.options.onBatch([item])
  }

  private addToQueue(segment: string, queueItem: BatchQueueItem<T>): void {
    // Получаем или создаем очередь для сегмента
    let queue = this.queues.get(segment)
    if (!queue) {
      queue = []
      this.queues.set(segment, queue)
    }

    // Добавляем элемент в очередь
    queue.push(queueItem)

    // Очищаем существующий таймаут
    this.clearSegmentTimeout(segment)

    // Если достигли размера батча, обрабатываем сразу
    if (queue.length >= this.options.batchSize) {
      this.processBatch(segment)
    } else {
      // Иначе устанавливаем таймаут
      this.setSegmentTimeout(segment)
    }
  }

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

  private async processBatch(segment: string): Promise<void> {
    const queue = this.queues.get(segment)
    if (!queue?.length) return

    // Очищаем очередь
    this.queues.delete(segment)
    this.clearSegmentTimeout(segment)

    try {
      // Объединяем похожие элементы если нужно
      const items = this.options.mergeItems(queue.map((item) => item.item))

      // Обрабатываем батч
      await this.options.onBatch(items)

      // Резолвим все промисы в очереди
      queue.forEach(({ resolve }) => resolve(undefined))
    } catch (error) {
      // В случае ошибки реджектим все промисы
      queue.forEach(({ reject }) => reject(error))
    }
  }

  // Метод для ручной обработки всех оставшихся элементов
  public async flush(): Promise<void> {
    const segments = Array.from(this.queues.keys())
    await Promise.all(segments.map((segment) => this.processBatch(segment)))
  }

  // Очистка всех очередей без обработки
  public clear(): void {
    this.queues.clear()
    Array.from(this.timeouts.values()).forEach(clearTimeout)
    this.timeouts.clear()
  }

  // Получение текущего состояния очередей
  public getState(): { [segment: string]: number } {
    const state: { [segment: string]: number } = {}
    this.queues.forEach((queue, segment) => {
      state[segment] = queue.length
    })
    return state
  }
}


// Пример использования BatchProcessor отдельно от middleware
/*
interface QueueItem {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  id: string;
  data?: any;
}

const batchProcessor = new BatchProcessor<QueueItem>({
  batchSize: 5,
  batchDelay: 1000,
  getSegmentKey: (item) => item.type,
  shouldBatch: (item) => item.type !== 'DELETE',
  mergeItems: (items) => {
    // Оставляем только последнюю операцию для каждого id
    return Array.from(
      items.reduce((map, item) => {
        map.set(item.id, item);
        return map;
      }, new Map<string, QueueItem>()).values()
    );
  },
  async onBatch(items) {
    console.log('Processing batch:', items);
    // Обработка батча
  }
});

// Использование
await batchProcessor.add({ type: 'INSERT', id: '1', data: { name: 'John' } });
await batchProcessor.add({ type: 'UPDATE', id: '1', data: { name: 'Johnny' } });
*/

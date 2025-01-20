// batch.utils.ts
export interface BatchOperation<T = any> {
  type: 'set' | 'delete'
  key: string
  value?: T
  metadata?: Record<string, any>
}

export interface BatchConfig {
  batchSize?: number
  batchDelay?: number
  onBatch?: (operations: BatchOperation[]) => Promise<void>
}

export class BatchProcessor {
  private queue: BatchOperation[] = []

  private timeout: NodeJS.Timeout | null = null

  constructor(private config: BatchConfig) {}

  async add(operation: BatchOperation): Promise<void> {
    this.queue.push(operation)

    if (this.queue.length >= (this.config.batchSize || 100)) {
      await this.flush()
    } else {
      await this.scheduleFlush()
    }
  }

  private async scheduleFlush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    this.timeout = setTimeout(() => {
      this.flush()
    }, this.config.batchDelay || 50)
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const operations = [...this.queue]
    this.queue = []

    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    if (this.config.onBatch) {
      await this.config.onBatch(operations)
    }
  }

  clear(): void {
    this.queue = []
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }
}


// В middleware:
// export const createBatchingMiddleware: MiddlewareFactory<BatchingMiddlewareOptions> = (options) => {
//   const processor = new BatchProcessor({
//     batchSize: options.batchSize,
//     batchDelay: options.batchDelay,
//     onBatch: async (operations) => {
//       // Обработка батча
//     }
//   });
//
//   return (next: NextFunction) => async (context: StorageContext) => {
//     // Использование BatchProcessor
//   };
// };
//
// // В плагине:
// const batchingPlugin: IStoragePlugin = {
//   name: 'batching',
//
//   private processor: BatchProcessor;
//
// initialize() {
//   this.processor = new BatchProcessor({
//     // конфигурация
//   });
// }
// };
//
// // В других местах:
// const processor = new BatchProcessor({
//   batchSize: 50,
//   batchDelay: 100,
//   onBatch: async (operations) => {
//     // Любая обработка батча
//   }
// });

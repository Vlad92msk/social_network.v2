// storage-batching.middleware.ts

import { MiddlewareFactory, NextFunction, StorageContext } from '../storage.interface'
import { BatchOperation, BatchProcessor } from '../utils/batch.utils'


export interface BatchingMiddlewareOptions {
  batchSize?: number
  batchDelay?: number
  segments?: string[]
}

// storage-batching.middleware.ts
export const createBatchingMiddleware: MiddlewareFactory<BatchingMiddlewareOptions> = (
  options: BatchingMiddlewareOptions = {},
) => {
  const {
    batchSize = 100,
    batchDelay = 50,
    segments = [],
  } = options

  const processors = new Map<string, BatchProcessor>()

  const getProcessor = (segmentKey: string, next: NextFunction): BatchProcessor => {
    if (!processors.has(segmentKey)) {
      processors.set(
        segmentKey,
        new BatchProcessor({
          batchSize,
          batchDelay,
          onBatch: async (operations) => {
            // Выполняем все операции батча последовательно
            for (const op of operations) {
              await next({
                type: op.type,
                key: op.key,
                value: op.value,
                metadata: { ...op.metadata, batch: true },
              })
            }
          },
        }),
      )
    }
    return processors.get(segmentKey)!
  }

  return (next: NextFunction) => async (context: StorageContext) => {
    // Пропускаем операции чтения и очистки
    if (context.type === 'get' || context.type === 'clear' || context.type === 'keys') {
      return next(context)
    }

    // Если это уже батч операция - выполняем как есть
    if (context.metadata?.batch) {
      return next(context)
    }

    // Определяем сегмент из ключа
    const segmentKey = context.key?.split('.')[0] || 'default'

    // Если сегмент не в списке - выполняем как есть
    if (segments.length > 0 && !segments.includes(segmentKey)) {
      return next(context)
    }

    // Создаем операцию для батча
    const operation: BatchOperation = {
      type: context.type as 'set' | 'delete',
      key: context.key!,
      value: context.value,
      metadata: context.metadata,
    }

    // Получаем процессор и добавляем операцию
    const processor = getProcessor(segmentKey, next)
    await processor.add(operation)

    // Операция добавлена в батч, она будет выполнена позже через onBatch
    // Возвращаем результат текущей операции
    return next(context)
  }
}

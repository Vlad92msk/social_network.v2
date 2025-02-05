// storage-batching.middleware.ts
import { Middleware, NextFunction, StorageContext } from '../storage.interface'
import { BatchProcessor } from '../utils/batch.utils'

export interface BatchingMiddlewareOptions {
  batchSize?: number
  batchDelay?: number
  segments?: string[]
}

export const createBatchingMiddleware = (
  options: BatchingMiddlewareOptions = {},
): Middleware => {
  const batchProcessor = new BatchProcessor<StorageContext>({
    batchSize: options.batchSize,
    batchDelay: options.batchDelay,
    getSegmentKey: (context) => context.key || 'default',
    shouldBatch: (context) => {
      if (context.type === 'get' || context.type === 'keys') return false
      if (options.segments?.length) {
        return options.segments.includes(context.key || 'default')
      }
      return true
    },
    mergeItems: (contexts) => contexts.reduce((acc, context) => {
      if (context.type === 'set') {
        const existingIndex = acc.findIndex(
          (existing) => existing.type === 'set' && existing.key === context.key,
        )
        if (existingIndex !== -1) {
          acc[existingIndex] = context
        } else {
          acc.push(context)
        }
      } else {
        acc.push(context)
      }
      return acc
    }, [] as StorageContext[]),
  })

  return (context: StorageContext) => async (next: NextFunction) =>
    batchProcessor.add({
      ...context,
      baseOperation: async () => next(context),
    })
}

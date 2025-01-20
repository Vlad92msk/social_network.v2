import { Middleware, NextFunction, StorageContext } from '../../core/core.interface'
import { DefaultMiddlewareOptions } from '../base-storage.service'
import { IStorageConfig } from '../storage.interface'

export class MiddlewareChain {
  private middlewares: Middleware[] = []

  constructor(
    getDefaultMiddleware: (options?: DefaultMiddlewareOptions) => Middleware[],
    config?: IStorageConfig,
  ) {
    this.middlewares = [
      ...getDefaultMiddleware(),
      ...(config?.middlewares?.(getDefaultMiddleware) || []),
    ]
  }

  async execute(context: StorageContext): Promise<any> {
    if (!context.baseOperation) {
      throw new Error('baseOperation is required for middleware execution')
    }

    // Фильтруем middleware по сегментам
    const applicableMiddlewares = this.middlewares.filter((middleware) => {
      const { options } = middleware
      return !options?.segments
        || (context.segment && options.segments.includes(context.segment))
    })

    // Создаем цепочку выполнения
    const handler = applicableMiddlewares.reduceRight(
      (next: NextFunction, middleware: Middleware) => middleware(next),
      context.baseOperation,
    )

    return handler(context)
  }
}

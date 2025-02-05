// middleware-chain.ts
import {
  DefaultMiddlewareOptions,
  GetDefaultMiddleware,
  Middleware,
  StorageConfig,
  StorageContext,
} from '../storage.interface'

export class MiddlewareChain {
  private middlewares: Middleware[] = []

  constructor(
    private readonly getDefaultMiddleware: GetDefaultMiddleware,
    private readonly config?: StorageConfig,
  ) {}

  public initialize(): void {
    if (this.config?.middlewares) {
      this.middlewares = this.config.middlewares(this.getDefaultMiddleware)
    } else {
      this.middlewares = this.getDefaultMiddleware()
    }
  }

  public async execute(context: StorageContext): Promise<any> {
    const chain = this.middlewares.reduceRight(
      (next, middleware) => async (ctx: StorageContext) => {
        const handler = middleware(ctx)
        return handler(next)
      },
      async (ctx: StorageContext) => {
        if (!ctx.baseOperation) {
          throw new Error('Base operation is not defined')
        }
        return ctx.baseOperation(ctx)
      },
    )

    return chain(context)
  }

  // Методы управления middleware
  public use(middleware: Middleware): void {
    this.middlewares.push(middleware)
  }

  public remove(middleware: Middleware): void {
    const index = this.middlewares.indexOf(middleware)
    if (index !== -1) {
      this.middlewares.splice(index, 1)
    }
  }

  public clear(): void {
    this.middlewares = []
  }

  public getMiddlewares(): Middleware[] {
    return [...this.middlewares]
  }

  // Метод для обновления опций middleware
  public updateMiddlewareOptions(
    middleware: Middleware,
    options: Partial<DefaultMiddlewareOptions>,
  ): void {
    const index = this.middlewares.indexOf(middleware)
    if (index !== -1 && middleware.options) {
      //@ts-ignore
      this.middlewares[index] = {
        ...middleware,
        options: { ...middleware.options, ...options },
      }
    }
  }
}

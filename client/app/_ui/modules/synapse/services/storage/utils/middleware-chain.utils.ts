import {
  DefaultMiddlewareOptions,
  Middleware,
  StorageConfig,
  StorageContext,
} from '../storage.interface'

export class MiddlewareChain {
  private middlewares: Middleware[] = []

  constructor(
    private readonly getDefaultMiddleware: (options?: DefaultMiddlewareOptions) => Middleware[],
    private readonly config?: StorageConfig,
  ) {
    this.initializeMiddlewares()
  }

  private initializeMiddlewares(): void {
    if (this.config?.middlewares) {
      this.middlewares = this.config.middlewares(this.getDefaultMiddleware)
    } else {
      this.middlewares = this.getDefaultMiddleware()
    }
  }

  public async execute(context: StorageContext): Promise<any> {
    if (!context.baseOperation) {
      throw new Error('Base operation is required')
    }

    // Создаем цепочку middleware путем последовательного применения каждого middleware
    const chain = this.middlewares.reduce(
      (next, middleware) => middleware(next),
      context.baseOperation,
    )

    // Выполняем цепочку middleware
    return chain(context)
  }

  public addMiddleware(middleware: Middleware): void {
    this.middlewares.push(middleware)
  }

  public removeMiddleware(middleware: Middleware): void {
    const index = this.middlewares.indexOf(middleware)
    if (index !== -1) {
      this.middlewares.splice(index, 1)
    }
  }

  public clearMiddlewares(): void {
    this.middlewares = []
  }

  public getMiddlewares(): Middleware[] {
    return [...this.middlewares]
  }
}

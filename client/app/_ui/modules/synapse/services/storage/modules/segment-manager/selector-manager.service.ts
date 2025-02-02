import { ILogger } from '../../storage.interface'
import { ResultFunction, Selector, SelectorAPI, SelectorOptions, Subscribable, } from './segment.interface'

interface Subscriber<T> {
  notify: (value: T) => void;
}

export class SelectorSubscription<T> implements Subscribable<T> {
  private readonly id: string

  private readonly subscribers = new Set<Subscriber<T>>()

  private lastValue?: T

  constructor(
    public readonly getState: () => Promise<T>,
    private readonly equals: (a: T, b: T) => boolean,
    private readonly logger?: ILogger,
  ) {
    this.id = `selector_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  async notify(): Promise<void> {
    try {
      const newValue = await this.getState()

      if (this.lastValue === undefined || !this.equals(newValue, this.lastValue)) {
        this.lastValue = newValue
        await Promise.all(
          Array.from(this.subscribers).map((sub) => {
            try {
              return sub.notify(newValue)
            } catch (error) {
              this.logger?.error(`Error notifying subscriber in selector ${this.id}`, { error })
              return Promise.resolve()
            }
          }),
        )
      }
    } catch (error) {
      this.logger?.error(`Error in selector ${this.id} notification`, { error })
    }
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    this.subscribers.add(subscriber)

    // Отправляем текущее значение
    if (this.lastValue !== undefined) {
      subscriber.notify(this.lastValue)
    } else {
      this.notify().catch((error) => {
        this.logger?.error(`Error in initial selector ${this.id} notification`, { error })
      })
    }

    return () => {
      this.unsubscribe(subscriber)
    }
  }

  private unsubscribe(subscriber: Subscriber<T>): void {
    this.subscribers.delete(subscriber)
  }

  cleanup(): void {
    this.subscribers.clear()
    this.lastValue = undefined
  }

  getId(): string {
    return this.id
  }
}

export class SelectorManager {
  private selectorSubscriptions = new Map<string, SelectorSubscription<any>>()

  private segmentSubscriptions = new Map<string, Set<string>>()

  constructor(private readonly logger?: ILogger) {}

  createSelector<S, T>(
    selectorOrDeps: Selector<S, T> | Array<SelectorAPI<any>>,
    resultFnOrOptions?: ResultFunction<any[], T> | SelectorOptions<T>,
    options?: SelectorOptions<T>,
    segmentName?: string,
  ): SelectorAPI<T> {
    if (!segmentName) {
      throw new Error('segmentName is required')
    }

    console.log('Creating selector for segment:', segmentName)

    if (Array.isArray(selectorOrDeps)) {
      return this.createCombinedSelector(
        selectorOrDeps,
        resultFnOrOptions as ResultFunction<any[], T>,
        segmentName,
        options || {},
      )
    }

    return this.createSimpleSelector(
      selectorOrDeps,
      segmentName,
      resultFnOrOptions as SelectorOptions<T> || {},
    )
  }

  public createSimpleSelector<S, T>(
    getStateOrSelector: (() => Promise<T>) | SelectorAPI<T> | Selector<S, T>,
    segmentName: string,
    options: SelectorOptions<T> = {},
  ): SelectorAPI<T> {
    console.log('Creating simple selector for segment:', segmentName)

    let getState: () => Promise<T>

    if (typeof getStateOrSelector === 'function') {
      if (getStateOrSelector.length === 0) {
        // Это асинхронный getState
        getState = getStateOrSelector as () => Promise<T>
      } else {
        // Это селектор, требующий состояния - такого быть не должно
        this.logger?.error('Invalid selector provided', { getStateOrSelector })
        throw new Error('Invalid selector provided')
      }
    } else {
      // Это SelectorAPI
      getState = getStateOrSelector.select
    }

    const subscription = new SelectorSubscription<T>(
      getState,
      options.equals || ((a, b) => a === b),
      this.logger,
    )

    const id = subscription.getId()
    this.selectorSubscriptions.set(id, subscription)

    // Привязываем селектор к сегменту
    if (segmentName) {
      if (!this.segmentSubscriptions.has(segmentName)) {
        this.segmentSubscriptions.set(segmentName, new Set())
      }
      this.segmentSubscriptions.get(segmentName)!.add(id)
    }

    return {
      select: () => subscription.getState(),
      subscribe: (subscriber) => {
        const unsubscribe = subscription.subscribe(subscriber)
        return () => {
          unsubscribe()
          this.selectorSubscriptions.delete(id)
          if (segmentName) {
            this.segmentSubscriptions.get(segmentName)?.delete(id)
          }
        }
      },
    }
  }

  private createCombinedSelector<T>(
    deps: Array<SelectorAPI<any>>,
    resultFn: ResultFunction<any[], T>,
    segmentName: string,
    options: SelectorOptions<T> = {},
  ): SelectorAPI<T> {
    const getState = async () => {
      const values = await Promise.all(deps.map((dep) => dep.select()))
      return resultFn(...values)
    }

    const subscription = new SelectorSubscription<T>(
      getState,
      options.equals || ((a, b) => a === b),
      this.logger,
    )

    const id = subscription.getId()
    this.selectorSubscriptions.set(id, subscription)

    // Привязываем селектор к сегменту
    if (segmentName) {
      if (!this.segmentSubscriptions.has(segmentName)) {
        this.segmentSubscriptions.set(segmentName, new Set())
      }
      this.segmentSubscriptions.get(segmentName)!.add(id)
    }

    // Подписываемся на все зависимости
    deps.forEach((dep, index) => {
      dep.subscribe({
        notify: async () => {
          await subscription.notify()
        },
      })
    })

    return {
      select: () => subscription.getState(),
      subscribe: (subscriber) => subscription.subscribe(subscriber),
    }
  }

  public getSubscriptionsBySegment(segmentName: string): SelectorSubscription<any>[] {
    const selectorIds = this.segmentSubscriptions.get(segmentName)
    if (!selectorIds) {
      return []
    }

    return Array.from(selectorIds)
      .map((id) => this.selectorSubscriptions.get(id))
      .filter((sub): sub is SelectorSubscription<any> => sub !== undefined)
  }

  async notifySegment(segmentName: string) {
    const subscriptions = this.getSubscriptionsBySegment(segmentName)
    return Promise.all(subscriptions.map((sub) => sub.notify()))
  }

  cleanup(): void {
    this.selectorSubscriptions.forEach((subscription) => subscription.cleanup())
    this.selectorSubscriptions.clear()
    this.segmentSubscriptions.clear()
  }
}

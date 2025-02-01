import {
  ResultFunction,
  Selector,
  SelectorAPI,
  SelectorOptions,
  Subscribable,
} from './segment.interface'
import { ILogger } from '../../storage.interface'

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
      console.log(`Notifying selector ${this.id}`)
      const newValue = await this.getState()
      console.log(`New value for selector ${this.id}:`, newValue)

      if (this.lastValue === undefined || !this.equals(newValue, this.lastValue)) {
        console.log(`Value changed for selector ${this.id}, updating subscribers`)
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
      } else {
        console.log(`Value unchanged for selector ${this.id}, skipping update`)
      }
    } catch (error) {
      this.logger?.error(`Error in selector ${this.id} notification`, { error })
    }
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    console.log(`Adding subscriber to selector ${this.id}`)
    this.subscribers.add(subscriber)

    // Отправляем текущее значение
    if (this.lastValue !== undefined) {
      console.log(`Sending current value to new subscriber in selector ${this.id}`)
      subscriber.notify(this.lastValue)
    } else {
      console.log(`Getting initial value for new subscriber in selector ${this.id}`)
      this.notify().catch((error) => {
        this.logger?.error(`Error in initial selector ${this.id} notification`, { error })
      })
    }

    return () => {
      console.log(`Removing subscriber from selector ${this.id}`)
      this.unsubscribe(subscriber)
    }
  }

  private unsubscribe(subscriber: Subscriber<T>): void {
    this.subscribers.delete(subscriber)
  }

  cleanup(): void {
    console.log(`Cleaning up selector ${this.id}`)
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
      console.log(`Selector ${id} registered for segment ${segmentName}`)
    }

    return {
      select: () => {
        console.log(`Selecting value for selector ${id}`)
        return subscription.getState()
      },
      subscribe: (subscriber) => {
        console.log(`Adding subscriber to selector ${id}`)
        const unsubscribe = subscription.subscribe(subscriber)
        return () => {
          console.log(`Removing subscriber from selector ${id}`)
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
    console.log('Creating combined selector with dependencies')

    const getState = async () => {
      console.log('Getting values from dependencies')
      const values = await Promise.all(deps.map((dep) => dep.select()))
      console.log('Dependency values:', values)
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
      console.log(`Combined selector ${id} registered for segment ${segmentName}`)
    }

    // Подписываемся на все зависимости
    deps.forEach((dep, index) => {
      console.log(`Subscribing to dependency ${index} for selector ${id}`)
      dep.subscribe({
        notify: async () => {
          console.log(`Dependency ${index} updated for selector ${id}`)
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
    console.log(`Getting subscriptions for segment ${segmentName}`)
    const selectorIds = this.segmentSubscriptions.get(segmentName)
    if (!selectorIds) {
      console.log(`No subscriptions found for segment ${segmentName}`)
      return []
    }

    const subscriptions = Array.from(selectorIds)
      .map((id) => this.selectorSubscriptions.get(id))
      .filter((sub): sub is SelectorSubscription<any> => sub !== undefined)

    console.log(`Found ${subscriptions.length} subscriptions for segment ${segmentName}`)
    return subscriptions
  }

  async notifySegment(segmentName: string) {
    console.log(`Notifying all selectors for segment ${segmentName}`)
    const subscriptions = this.getSubscriptionsBySegment(segmentName)
    return Promise.all(subscriptions.map((sub) => sub.notify()))
  }

  cleanup(): void {
    console.log('Cleaning up all selectors')
    this.selectorSubscriptions.forEach((subscription) => subscription.cleanup())
    this.selectorSubscriptions.clear()
    this.segmentSubscriptions.clear()
  }
}

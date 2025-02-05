// selector.module.ts

import { ILogger, IStorage } from '../../storage.interface'
import { ResultFunction, Selector, SelectorAPI, SelectorOptions, Subscriber } from '../segment-manager/segment.interface'

class SelectorSubscription<T> {
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
    console.log('notify')
    try {
      const newValue = await this.getState()

      if (this.lastValue === undefined || !this.equals(newValue, await this.lastValue)) {
        this.lastValue = newValue
        await Promise.all([...this.subscribers].map(async (sub) => sub.notify(newValue)))
      }
    } catch (error) {
      this.logger?.error(`Error in selector ${this.id} notification`, { error })
    }
  }

  subscribe(subscriber: Subscriber<T>) {
    this.subscribers.add(subscriber)

    // Отправляем текущее значение
    if (this.lastValue !== undefined) {
      subscriber.notify(this.lastValue)
    } else {
      this.notify().catch((error) => {
        this.logger?.error(`Error in initial selector ${this.id} notification`, { error })
      })
    }

    return () => this.unsubscribe(subscriber)
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

export class SelectorModule {
  storageName: string

  private subscriptions = new Map<string, SelectorSubscription<any>>()

  constructor(
    private readonly source: IStorage,
    private readonly logger?: ILogger,
  ) {
    console.log('SelectorModule initialized with source:', this.source)
    this.storageName = source.name
  }

  createSelector<S, T>(selector: Selector<S, T>, options?: SelectorOptions<T>): SelectorAPI<T>;

  createSelector<Deps extends any[], T>(
    dependencies: Array<Selector<any, Deps[number]> | SelectorAPI<Deps[number]>>,
    resultFn: ResultFunction<Deps, T>,
    options?: SelectorOptions<T>
  ): SelectorAPI<T>;

  createSelector<S, T>(
    selectorOrDeps: Selector<S, T> | Array<SelectorAPI<any> | Selector<any, any>>,
    resultFnOrOptions?: ResultFunction<any[], T> | SelectorOptions<T>,
    options?: SelectorOptions<T>,
  ): SelectorAPI<T> {
    if (Array.isArray(selectorOrDeps)) {
      const deps: SelectorAPI<any>[] = selectorOrDeps.map((dep) => {
        if (typeof dep === 'function') {
          return this.createSimpleSelector(dep)
        }
        return dep
      })

      return this.createCombinedSelector(
        deps,
        resultFnOrOptions as ResultFunction<any[], T>,
        options || {},
      )
    }

    return this.createSimpleSelector(selectorOrDeps, resultFnOrOptions as SelectorOptions<T>)
  }

  createSimpleSelector<S, T>(
    selector: Selector<S, T>,
    options: SelectorOptions<T> = {},
  ): SelectorAPI<T> {
    const getState = async (): Promise<T> => {
      const state = await this.source.getState()
      console.log('createSimpleSelector getState', state)
      return selector(state as S)
    }

    const subscription = new SelectorSubscription(
      getState,
      options.equals || ((a, b) => a === b),
      this.logger,
    )

    const id = subscription.getId()
    this.subscriptions.set(id, subscription)

    let unsubscribe: (() => void) | undefined

    // Пробуем использовать глобальную подписку
    if (typeof this.source.subscribeToAll === 'function') {
      unsubscribe = this.source.subscribeToAll(async () => {
        await subscription.notify()
      })
    } else {
      // Фолбэк: подписываемся на изменение состояния через события
      // Здесь можно использовать eventEmitter если он есть
      this.logger?.warn('Storage does not support global subscription')
    }

    return {
      select: () => subscription.getState(),
      subscribe: (subscriber) => {
        const unsub = subscription.subscribe(subscriber)
        return () => {
          unsub()
          this.subscriptions.delete(id)
          if (unsubscribe) {
            unsubscribe()
          }
        }
      },
    }
  }

  createCombinedSelector<T>(
    selectors: SelectorAPI<any>[],
    resultFn: (...args: any[]) => T,
    options: SelectorOptions<T> = {},
  ): SelectorAPI<T> {
    const getState = async () => {
      const values = await Promise.all(selectors.map((s) => s.select()))
      return resultFn(...values)
    }

    const subscription = new SelectorSubscription(
      getState,
      options.equals || ((a, b) => a === b),
      this.logger,
    )

    const id = subscription.getId()
    this.subscriptions.set(id, subscription)

    // Сохраняем функции отписки
    const unsubscribers = selectors.map((selector) => selector.subscribe({
      notify: async () => subscription.notify(),
    }))

    return {
      select: () => subscription.getState(),
      subscribe: (subscriber) => {
        const unsub = subscription.subscribe(subscriber)
        return () => {
          unsub()
          this.subscriptions.delete(id)
          // Отписываемся от всех входящих селекторов
          unsubscribers.forEach((unsubscribe) => unsubscribe())
        }
      },
    }
  }

  destroy(): void {
    this.subscriptions.forEach((sub) => sub.cleanup())
    this.subscriptions.clear()
  }
}

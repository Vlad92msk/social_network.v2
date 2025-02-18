// selector.module.ts

import { ResultFunction, Selector, SelectorAPI, SelectorOptions, Subscriber } from './selector.interface'
import { ILogger, IStorage } from '../../storage.interface'

class SelectorSubscription<T> {
  private readonly id: string

  readonly subscribers = new Set<Subscriber<T>>()

  private lastValue?: T

  constructor(
    public readonly getState: () => Promise<T>,
    private readonly equals: (a: T, b: T) => boolean,
    private readonly logger?: ILogger,
  ) {
    this.id = `selector_${Date.now()}_${Math.random().toString(36).slice(2)}`
    console.log('DEBUG: Created subscription:', this.id)
  }

  async notify(): Promise<void> {
    console.log('DEBUG: notify() called for:', this.id)

    try {
      const newValue = await this.getState()
      console.log('DEBUG: Got new value:', newValue, 'Last value was:', this.lastValue)

      // Всегда уведомляем при undefined или изменении значения
      if (this.lastValue === undefined || !this.equals(newValue, this.lastValue)) {
        console.log('DEBUG: Value changed, notifying subscribers')
        this.lastValue = newValue

        const promises = Array.from(this.subscribers).map(async (subscriber) => {
          try {
            console.log('DEBUG: Notifying subscriber about value:', newValue)
            await subscriber.notify(newValue)
          } catch (error) {
            console.error('DEBUG: Error in subscriber notification:', error)
          }
        })

        await Promise.all(promises)
      } else {
        console.log('DEBUG: Value unchanged, skipping notification')
      }
    } catch (error) {
      console.error('DEBUG: Error in notify():', error)
      throw error
    }
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    console.log('DEBUG: Subscribe called for:', this.id)
    this.subscribers.add(subscriber)

    // Сразу уведомляем о текущем значении
    this.notify().catch((error) => {
      console.error('DEBUG: Error in initial notification:', error)
    })

    return () => {
      console.log('DEBUG: Unsubscribe called for:', this.id)
      this.subscribers.delete(subscriber)
    }
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
    console.log('DEBUG: Creating simple selector')

    const getState = async (): Promise<T> => {
      console.log('DEBUG: getState called')
      const state = await this.source.getState()
      console.log('DEBUG: State from storage:', state)
      const selectedValue = selector(state as S)
      console.log('DEBUG: Selected value:', selectedValue)
      return selectedValue
    }

    const subscription = new SelectorSubscription(
      getState,
      options.equals || ((a, b) => a === b),
      this.logger,
    )

    const id = subscription.getId()
    this.subscriptions.set(id, subscription)
    console.log('DEBUG: Added subscription:', id)

    // Упрощённая обработка событий
    const unsubscribe = this.source.subscribeToAll((event: any) => {
      console.log('DEBUG: Selector received event:', JSON.stringify(event))

      // Упрощаем проверку события
      if (event && event.type === 'storage:update') {
        console.log('DEBUG: Valid update event, notifying subscribers')

        // Сразу запускаем обновление без дополнительных проверок
        subscription.notify().then(() => {
          console.log('DEBUG: Notification completed')
        }).catch((error) => {
          console.error('DEBUG: Notification error:', error)
        })
      } else {
        console.log('DEBUG: Invalid event format:', event)
      }
    })

    console.log('DEBUG: Subscribed to storage updates')

    // Изменяем API селектора
    const api = {
      select: () => getState(),
      subscribe: (subscriber: Subscriber<T>) => {
        console.log('DEBUG: Adding new subscriber')
        const unsub = subscription.subscribe(subscriber)

        return () => {
          console.log('DEBUG: Removing subscriber')
          unsub()
          // Не удаляем подписку на хранилище при отписке одного подписчика
          if (this.subscriptions.get(id)?.subscribers.size === 0) {
            console.log('DEBUG: No more subscribers, cleaning up')
            this.subscriptions.delete(id)
            unsubscribe()
          }
        }
      },
    }

    return api
  }

  createCombinedSelector<T>(
    selectors: SelectorAPI<any>[],
    resultFn: (...args: any[]) => T,
    options: SelectorOptions<T> = {},
  ): SelectorAPI<T> {
    console.log('DEBUG: Creating combined selector')

    const getState = async () => {
      console.log('DEBUG: Combined selector getState called')
      const values = await Promise.all(selectors.map(async (s, index) => {
        const value = await s.select()
        console.log(`DEBUG: Dependency ${index} value:`, value)
        return value
      }))
      const result = resultFn(...values)
      console.log('DEBUG: Combined selector result:', result)
      return result
    }

    const subscription = new SelectorSubscription(
      getState,
      options.equals || ((a, b) => a === b),
      this.logger,
    )

    const id = subscription.getId()
    this.subscriptions.set(id, subscription)
    console.log('DEBUG: Added combined subscription:', id)

    // Set для отслеживания ожидающих обновлений
    let pendingUpdate = false
    const debouncedNotify = () => {
      if (!pendingUpdate) {
        pendingUpdate = true
        Promise.resolve().then(() => {
          pendingUpdate = false
          subscription.notify().catch((error) => {
            console.error('DEBUG: Error in combined notification:', error)
          })
        })
      }
    }

    // Подписываемся на все зависимости
    const unsubscribers = selectors.map((selector, index) => selector.subscribe({
      notify: async (value) => {
        console.log(`DEBUG: Dependency ${index} updated:`, value)
        debouncedNotify()
      },
    }))

    return {
      select: () => getState(),
      subscribe: (subscriber) => {
        console.log('DEBUG: Adding subscriber to combined selector')
        const unsub = subscription.subscribe(subscriber)

        return () => {
          console.log('DEBUG: Removing subscriber from combined selector')
          unsub()
          if (this.subscriptions.get(id)?.subscribers.size === 0) {
            console.log('DEBUG: No more subscribers, cleaning up combined selector')
            this.subscriptions.delete(id)
            unsubscribers.forEach((unsubscribe) => unsubscribe())
          }
        }
      },
    }
  }

  destroy(): void {
    this.subscriptions.forEach((sub) => sub.cleanup())
    this.subscriptions.clear()
  }
}

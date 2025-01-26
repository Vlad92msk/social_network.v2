import { Inject, Injectable } from '@ui/modules/synapse/decorators'
import { BaseModule } from '../../../core/base.service'
import type { IDIContainer } from '../../../di-container/di-container.interface'
import { SelectorAPI, SelectorOptions, Subscribable, Subscriber } from '../../storage.interface'

export class SelectorSubscription<T> implements Subscribable<T> {
  readonly id: string

  readonly subscribers = new Set<Subscriber<T>>()

  private lastValue?: T

  constructor(
    readonly selector: () => Promise<T>,
    private equals: (a: T, b: T) => boolean,
  ) {
    this.id = `selector_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  async notify(): Promise<void> {
    const newValue = await this.selector()
    if (this.lastValue === undefined || !this.equals(newValue, this.lastValue)) {
      this.lastValue = newValue
      await Promise.all(
        Array.from(this.subscribers).map((sub) => sub.notify(newValue)),
      )
    }
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    this.subscribers.add(subscriber)
    this.notify() // Сразу отправляем текущее значение
    return () => this.unsubscribe(subscriber)
  }

  unsubscribe(subscriber: Subscriber<T>): void {
    this.subscribers.delete(subscriber)
  }

  cleanup(): void {
    this.subscribers.clear()
  }
}

@Injectable()
export class SelectorManager extends BaseModule {
  readonly name = 'selectorManager'

  private selectorSubscriptions = new Map<string, SelectorSubscription<any>>()

  constructor(@Inject('container') container: IDIContainer) {
    super(container)
  }

  createSelector<T>(
    selectorOrDeps: (() => Promise<T>) | Array<SelectorAPI<any>>,
    resultFnOrOptions?: ((...values: any[]) => T) | SelectorOptions<T>,
    options?: SelectorOptions<T>,
  ): SelectorAPI<T> {
    if (Array.isArray(selectorOrDeps)) {
      return this.createCombinedSelector(
        selectorOrDeps,
        resultFnOrOptions as (...values: any[]) => T,
        options || {},
      )
    }
    return this.createSimpleSelector(
      selectorOrDeps,
      (resultFnOrOptions as SelectorOptions<T>) || {},
    )
  }

  private createSimpleSelector<T>(
    selector: () => Promise<T>,
    options: SelectorOptions<T>,
  ): SelectorAPI<T> {
    const id = this.generateId()
    const subscription = new SelectorSubscription(
      selector,
      options.equals || ((a, b) => a === b),
    )

    this.selectorSubscriptions.set(id, subscription)

    return {
      select: selector,
      subscribe: (listener) => {
        const unsubscribe = subscription.subscribe(listener)
        return () => {
          unsubscribe()
          this.selectorSubscriptions.delete(id)
        }
      },
    }
  }

  private createCombinedSelector<T>(
    deps: Array<SelectorAPI<any>>,
    resultFn: (...values: any[]) => T,
    options: SelectorOptions<T>,
  ): SelectorAPI<T> {
    const selector = async () => {
      const values = await Promise.all(deps.map((dep) => dep.select()))
      return resultFn(...values)
    }

    const subscription = new SelectorSubscription(
      selector,
      options.equals || ((a, b) => a === b),
    )

    deps.forEach((dep) => {
      dep.subscribe({
        notify: async () => subscription.notify(),
      })
    })

    return {
      select: selector,
      subscribe: (listener) => subscription.subscribe(listener),
    }
  }

  protected async cleanupResources(): Promise<void> {
    this.selectorSubscriptions.forEach((sub) => sub.cleanup())
    this.selectorSubscriptions.clear()
  }

  protected async registerServices(): Promise<void> {}

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('app', (event) => {
      if (event.type === 'app:cleanup') this.cleanupResources()
    })
  }

  private generateId(): string {
    return `selector_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }
}

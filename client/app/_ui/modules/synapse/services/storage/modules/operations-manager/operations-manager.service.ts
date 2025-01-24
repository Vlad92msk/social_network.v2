import { Inject, Injectable } from '@ui/modules/synapse/decorators'
import { BaseModule } from '../../../core/base.service'
import type { IDIContainer } from '../../../di-container/di-container.interface'
import { SelectorAPI, SelectorOptions, Subscribable, Subscriber } from '../../storage.interface'
import { StateManager } from '../state-manager/state-manager.service'

class SelectorSubscription<T> implements Subscribable<T> {
  readonly id: string

  readonly subscribers = new Set<Subscriber<T>>()

  private lastValue?: T

  constructor(
    readonly selector: (state: any) => T | Promise<T>,
    private equals: (a: T, b: T) => boolean,
  ) {
    this.id = `selector_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  // Обработка обновлений
  async notify(state: any): Promise<void> {
    const newValue = await this.selector(state)
    // Уведомляем подписчиков только если значение изменилось
    if (!this.lastValue || !this.equals(newValue, this.lastValue)) {
      this.lastValue = newValue
      await Promise.all(
        Array.from(this.subscribers).map((sub) => sub.notify(newValue)),
      )
    }
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    this.subscribers.add(subscriber)
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
export class StateOperationsManager extends BaseModule {
  readonly name = 'operationsManager'

  private selectorSubscriptions = new Map<string, SelectorSubscription<any>>()

  private unsubscribeFromState: (() => void) | null = null

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('stateManager') private stateManager: StateManager,
  ) {
    super(container)
  }

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('app', (event) => {
      if (event.type === 'app:cleanup') this.cleanupResources()
    })
  }

  createSelector<T>(
    selectorOrDeps: ((state: any) => T) | Array<SelectorAPI<any>>,
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

  private createSimpleSelector<T>(selector: (state: any) => T, options: SelectorOptions<T>): SelectorAPI<T> {
    const id = this.generateId()
    const subscription = new SelectorSubscription(selector, options.equals || ((a, b) => a === b))

    this.selectorSubscriptions.set(id, subscription)
    this.stateManager.getState().then((state) => subscription.notify(state))

    return {
      select: async () => {
        const state = await this.stateManager.getState()
        return selector(state)
      },
      subscribe: (listener) => {
        const unsubscribe = subscription.subscribe(listener)
        return () => {
          const isEmpty = unsubscribe()
          if (Boolean(isEmpty)) {
            this.selectorSubscriptions.delete(id)
          }
        }
      },
    }
  }

  private createCombinedSelector<T>(
    deps: Array<SelectorAPI<any>>,
    resultFn: (...values: any[]) => T,
    options: SelectorOptions<T>,
  ): SelectorAPI<T> {
    const subscription = new SelectorSubscription(
      async (state: any) => {
        const values = await Promise.all(deps.map((dep) => dep.select()))
        return resultFn(...values)
      },
      options.equals || ((a, b) => a === b),
    )

    deps.forEach((dep) => {
      dep.subscribe({
        id: subscription.id,
        notify: async () => {
          const state = await this.stateManager.getState()
          await subscription.notify(state)
        },
      })
    })

    return {
      select: async () => {
        const state = await this.stateManager.getState()
        return subscription.selector(state)
      },
      subscribe: (listener) => subscription.subscribe(listener),
    }
  }

  protected async registerServices(): Promise<void> {
    this.unsubscribeFromState = this.stateManager.subscribe((state) => this.selectorSubscriptions.forEach((sub) => sub.notify(state)))
  }

  private generateId(): string {
    return `selector_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  protected async cleanupResources(): Promise<void> {
    if (this.unsubscribeFromState) this.unsubscribeFromState()
    this.selectorSubscriptions.forEach((sub) => sub.cleanup())
    this.selectorSubscriptions.clear()
  }
}

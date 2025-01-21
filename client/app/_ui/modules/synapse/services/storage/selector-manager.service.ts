import { isEqual } from 'lodash'
import { StateManager } from './segment-manager.service'
import { ResultFunction, Selector, SelectorAPI, SelectorOptions } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import type { IDIContainer } from '../di-container/di-container.interface'

@Injectable()
export class SelectorManager extends BaseModule {
  readonly name = 'selectorManager'

  private selectorSubscriptions = new Map<string, Set<() => void>>()

  private selectors = new Map<string, (state: any) => any>()

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('stateManager') private readonly stateManager: StateManager,
  ) {
    super(container)
  }

  protected async registerServices(): Promise<void> {
    // Нет необходимости регистрировать дополнительные сервисы
  }

  protected async setupEventHandlers(): Promise<void> {
    // Подписываемся на изменения в storage для обновления селекторов
    this.eventBus.subscribe('storage', async (event) => {
      if (event.type === 'storage:changed') {
        this.notifySelectors(event.payload.key)
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    this.selectorSubscriptions.clear()
    this.selectors.clear()
  }

  // Public API для работы с одиночными селекторами
  createSelector<State extends Record<string, any>, R>(
    selector: Selector<State, R>,
    options?: SelectorOptions<R>
  ): SelectorAPI<R>;

  // Public API для работы с составными селекторами
  createSelector<State extends Record<string, any>, Deps extends any[], R>(
    dependencies: Array<Selector<State, Deps[number]>>,
    resultFn: ResultFunction<Deps, R>,
    options?: SelectorOptions<R>
  ): SelectorAPI<R>;

  createSelector<State extends Record<string, any>, Deps extends any[], R>(
    selectorOrDeps: Selector<State, R> | Array<Selector<State, Deps[number]>>,
    resultFnOrOptions?: ResultFunction<Deps, R> | SelectorOptions<R>,
    options?: SelectorOptions<R>,
  ): SelectorAPI<R> {
    const isSimpleSelector = typeof selectorOrDeps === 'function'
    const selectorOptions = isSimpleSelector
      ? (resultFnOrOptions as SelectorOptions<R>) || {}
      : options || {}
    const equals = selectorOptions.equals || isEqual
    const selectorKey = this.generateSelectorKey()

    if (isSimpleSelector) {
      return this.createSimpleSelector(
        selectorOrDeps as Selector<State, R>,
        equals,
        selectorKey,
      )
    }

    return this.createCompositeSelector(
      selectorOrDeps as Array<Selector<State, Deps[number]>>,
      resultFnOrOptions as ResultFunction<Deps, R>,
      equals,
      selectorKey,
    )
  }

  private generateSelectorKey(): string {
    return `selector_${Math.random().toString(36).substr(2, 9)}`
  }

  private createSimpleSelector<State, R>(
    selector: Selector<State, R>,
    equals: (a: R, b: R) => boolean,
    selectorKey: string,
  ): SelectorAPI<R> {
    let prevState: State | undefined
    let prevResult: R | undefined

    const select = async () => {
      const state = await this.stateManager.getState() as State
      if (prevState === state) return prevResult!

      prevState = state
      prevResult = selector(state)
      return prevResult
    }

    const subscribe = (listener: (value: R) => void) => {
      const callback = async () => {
        const state = await this.stateManager.getState() as State
        const newResult = selector(state)

        if (!equals(prevResult!, newResult)) {
          prevResult = newResult
          listener(newResult)
        }
      }

      return this.subscribeSelectorCallback(selectorKey, callback)
    }

    return { select, subscribe }
  }

  private createCompositeSelector<State, Deps extends any[], R>(
    dependencies: Array<Selector<State, Deps[number]>>,
    resultFn: ResultFunction<Deps, R>,
    equals: (a: R, b: R) => boolean,
    selectorKey: string,
  ): SelectorAPI<R> {
    let prevDeps: Deps = [] as any
    let prevResult: R | undefined

    const select = async () => {
      const state = await this.stateManager.getState() as State
      const depValues = dependencies.map((dep) => dep(state)) as Deps

      if (prevDeps.length && depValues.every((val, i) => equals(val, prevDeps[i]))) {
        return prevResult!
      }

      prevDeps = depValues
      prevResult = resultFn(...depValues)
      return prevResult
    }

    const subscribe = (listener: (value: R) => void) => {
      const callback = async () => {
        const state = await this.stateManager.getState() as State
        const depValues = dependencies.map((dep) => dep(state)) as Deps

        if (!prevDeps.length || depValues.some((val, i) => !equals(val, prevDeps[i]))) {
          prevDeps = depValues
          const newResult = resultFn(...depValues)

          if (!equals(newResult, prevResult!)) {
            prevResult = newResult
            listener(newResult)
          }
        }
      }

      return this.subscribeSelectorCallback(selectorKey, callback)
    }

    return { select, subscribe }
  }

  private subscribeSelectorCallback(key: string, callback: () => void): () => void {
    if (!this.selectorSubscriptions.has(key)) {
      this.selectorSubscriptions.set(key, new Set())
    }

    const subscriptions = this.selectorSubscriptions.get(key)!
    subscriptions.add(callback)

    return () => {
      const subs = this.selectorSubscriptions.get(key)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          this.selectorSubscriptions.delete(key)
        }
      }
    }
  }

  private notifySelectors(key: string): void {
    const selectors = this.selectorSubscriptions.get(key)
    if (selectors) {
      selectors.forEach((callback) => callback())
    }
  }
}

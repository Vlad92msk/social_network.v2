import { isEqual } from 'lodash'
import { StateManager } from '../state-manager/state-manager.service'
import { EqualityFn, ResultFunction, Selector, SelectorAPI, SelectorOptions } from '../../storage.interface'
import { Inject, Injectable } from '../../../../decorators'
import { BaseModule } from '../../../core/base.service'
import type { IDIContainer } from '../../../di-container/di-container.interface'

interface SelectorMetadata {
  options?: SelectorOptions<any>;
}
interface CleanupCallback {
  (): void;
}

@Injectable()
export class SelectorManager extends BaseModule {
  readonly name = 'selectorManager'

  // Метаданные и опции селекторов
  private selectorMetadata = new Map<string, SelectorMetadata>()

  // Подписчики на изменения
  private subscribers = new Map<string, Set<(value: any) => void>>()

  // Кэш значений
  private cache = new Map<string, any>()

  // Зависимости между селекторами
  private dependencies = new Map<string, Set<string>>()

  // Функции вычисления
  private selectorFunctions = new Map<string, (state: any) => any>()

  // Функции комбинирования результатов
  private resultFunctions = new Map<string, (...args: any[]) => any>()

  private cleanupCallbacks = new Set<CleanupCallback>()

  private getSelectorFunction(selectorId: string) {
    return this.selectorFunctions.get(selectorId)
  }

  private getResultFunction(selectorId: string) {
    return this.resultFunctions.get(selectorId)
  }

  constructor(
    @Inject('container') container: IDIContainer,
    @Inject('stateManager') private readonly stateManager: StateManager,
  ) {
    super(container)
  }

  protected async registerServices(): Promise<void> {
    const unsubscribe = this.stateManager.subscribeToState(
      (state) => {
        this.handleStateChange(state)
      },
      () => {
        this.logger.debug('Unsubscribed from state changes')
      },
    )

    this.cleanupCallbacks.add(unsubscribe)
  }

  protected async setupEventHandlers(): Promise<void> {
    this.eventBus.subscribe('app', async (event) => {
      if (event.type === 'app:cleanup') {
        await this.cleanupResources()
      }
    })
  }

  protected async cleanupResources(): Promise<void> {
    // Вызываем все колбэки очистки
    this.cleanupCallbacks.forEach((cleanup) => cleanup())
    this.cleanupCallbacks.clear()

    // Очищаем все коллекции
    this.subscribers.clear()
    this.cache.clear()
    this.dependencies.clear()
    this.selectorMetadata.clear()
    this.selectorFunctions.clear()
    this.resultFunctions.clear()
  }

  private handleStateChange(state: Record<string, any>): void {
    // Пересчитываем значения селекторов и уведомляем подписчиков
    for (const [selectorId, listeners] of this.subscribers.entries()) {
      const newValue = this.computeSelectorValue(selectorId, state)
      const oldValue = this.cache.get(selectorId)

      if (!this.areEqual(oldValue, newValue, selectorId)) {
        this.cache.set(selectorId, newValue)
        listeners.forEach((listener) => listener(newValue))
      }
    }
  }

  private areEqual(a: any, b: any, selectorId: string): boolean {
    const equalityFn = this.getEqualityFn(selectorId)
    return equalityFn(a, b)
  }

  private getEqualityFn(selectorId: string): EqualityFn<any> {
    const metadata = this.selectorMetadata.get(selectorId)
    return metadata?.options?.equals || isEqual
  }

  public createSelector<State extends Record<string, any>, R>(
    selectorOrDeps: Selector<State, R> | Array<Selector<State, any> | SelectorAPI<any>>,
    resultFnOrOptions?: ResultFunction<any[], R> | SelectorOptions<R>,
    extraOptions?: SelectorOptions<R>,
  ): SelectorAPI<R> {
    const selectorId = this.generateSelectorId()
    let selectorFn: (state: State) => Promise<R> | R
    let selectorOptions: SelectorOptions<R> | undefined

    if (Array.isArray(selectorOrDeps)) {
      // Комбинированный селектор
      const dependencies = selectorOrDeps
      const resultFn = resultFnOrOptions as ResultFunction<any[], R>
      selectorOptions = extraOptions

      selectorFn = async (state: State) => {
        // Получаем значения зависимостей, обрабатывая как обычные, так и асинхронные селекторы
        const depValues = await Promise.all(
          dependencies.map(async (dep) => {
            if ('select' in dep) {
              return dep.select()
            }
            return dep(state)
          }),
        )
        return resultFn(...depValues)
      }

      // Регистрируем зависимости
      this.dependencies.set(
        selectorId,
        new Set(dependencies.map((dep) => ('select' in dep ? dep.select.toString() : dep.toString()))),
      )
    } else {
      // Простой селектор
      selectorFn = selectorOrDeps
      selectorOptions = resultFnOrOptions as SelectorOptions<R>
    }

    // Сохраняем метаданные селектора
    this.selectorMetadata.set(selectorId, { options: selectorOptions })

    return {
      select: async () => {
        const state = await this.stateManager.getState()
        return selectorFn(state as State)
      },
      subscribe: (listener: (value: R) => void) => {
        if (!this.subscribers.has(selectorId)) {
          this.subscribers.set(selectorId, new Set())
        }
        this.subscribers.get(selectorId)!.add(listener)

        // Initial value
        this.stateManager.getState().then(async (state) => {
          const value = await selectorFn(state as State)
          this.cache.set(selectorId, value)
          listener(value)
        })

        return () => {
          const listeners = this.subscribers.get(selectorId)
          if (listeners) {
            listeners.delete(listener)
            if (listeners.size === 0) {
              this.subscribers.delete(selectorId)
              this.cache.delete(selectorId)
              this.dependencies.delete(selectorId)
              this.selectorMetadata.delete(selectorId)
            }
          }
        }
      },
    }
  }

  private generateSelectorId(): string {
    return `selector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private computeSelectorValue(selectorId: string, state: Record<string, any>): any {
    const deps = this.dependencies.get(selectorId)
    if (!deps) {
      // Для простых селекторов возвращаем результат выполнения функции селектора
      const selectorFn = this.getSelectorFunction(selectorId)
      return selectorFn ? selectorFn(state) : state
    }

    // Для комбинированных селекторов
    const depValues = Array.from(deps).map((depId) => {
      const depSelector = this.getSelectorFunction(depId)
      return depSelector ? depSelector(state) : undefined
    })

    const resultFn = this.getResultFunction(selectorId)
    return resultFn ? resultFn(...depValues) : depValues
  }
}

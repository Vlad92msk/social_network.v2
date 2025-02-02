import { IStorageSegment, ResultFunction, Selector, SelectorAPI, SelectorOptions, Subscriber } from './segment.interface'
import { ILogger, IStorage } from '../../storage.interface'
import { IPluginExecutor } from '../plugin-manager/plugin-managers.interface'
import { SelectorModule } from '../selector-module/selector.module'

export class StorageSegment<T extends Record<string, any>> implements IStorageSegment<T> {
  private subscriptions = new Set<Subscriber<T>>()

  constructor(
    private readonly name: string,
    private readonly storage: IStorage,
    private readonly selectorModule: SelectorModule,
    private readonly pluginExecutor?: IPluginExecutor,
    private readonly logger?: ILogger,
  ) {
    this.storage.subscribe(this.name, async () => {
      const state = await this.storage.get<T>(this.name)
      await this.notifySubscribers(state as T)
    })
  }

  async select<R>(selector: Selector<T, R>): Promise<R> {
    const state = await this.storage.get<T>(this.name)
    const processedKey = this.pluginExecutor?.executeBeforeGet(this.name) ?? this.name
    const value = state as T
    const processedValue = this.pluginExecutor?.executeAfterGet(processedKey, value) ?? value
    return selector(processedValue as T)
  }

  async update(updater: (state: T) => void): Promise<void> {
    const oldState = await this.storage.get<T>(this.name) || {} as T
    const newState = { ...oldState }
    updater(newState)

    const processedValue = this.pluginExecutor?.executeBeforeSet(this.name, newState) ?? newState
    await this.storage.set(this.name, processedValue)
    this.pluginExecutor?.executeAfterSet(this.name, processedValue)
  }

  async patch(value: Partial<T>): Promise<void> {
    const oldState = await this.storage.get<T>(this.name) || {} as T
    const newState = { ...oldState, ...value }
    const processedValue = this.pluginExecutor?.executeBeforeSet(this.name, newState) ?? newState
    await this.storage.set(this.name, processedValue)
    this.pluginExecutor?.executeAfterSet(this.name, processedValue)
  }

  async getByPath<R>(path: string): Promise<R | undefined> {
    return this.storage.get<R>(path)
  }

  async setByPath<R>(path: string, value: R): Promise<void> {
    await this.storage.set(path, value)
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    const wrappedSubscriber: Subscriber<T> = {
      notify: async (value) => {
        subscriber.notify(value)
      },
    }
    this.subscriptions.add(wrappedSubscriber)

    // Сразу отправляем текущее состояние
    this.storage.get<T>(this.name).then((state) => wrappedSubscriber.notify(state as T))

    return () => {
      this.subscriptions.delete(wrappedSubscriber)
    }
  }

  async clear(): Promise<void> {
    if (this.pluginExecutor?.executeBeforeDelete(this.name)) {
      await this.storage.clear()
      this.pluginExecutor?.executeAfterDelete(this.name)
      this.pluginExecutor?.executeOnClear()
    }
  }

  createSelector<R>(selector: Selector<T, R>, options?: SelectorOptions<R>): SelectorAPI<R>;

  createSelector<Deps extends any[], R>(
    dependencies: Array<Selector<T, Deps[number]> | SelectorAPI<Deps[number]>>,
    resultFn: ResultFunction<Deps, R>,
    options?: SelectorOptions<R>
  ): SelectorAPI<R>;

  createSelector<R>(
    selectorOrDeps: Selector<T, R> | Array<Selector<T, any> | SelectorAPI<any>>,
    resultFnOrOptions?: ResultFunction<any[], R> | SelectorOptions<R>,
    options?: SelectorOptions<R>,
  ): SelectorAPI<R> {
    if (Array.isArray(selectorOrDeps)) {
      return this.selectorModule.createSelector(
        selectorOrDeps as Array<Selector<any, any> | SelectorAPI<any>>,
        resultFnOrOptions as ResultFunction<any[], R>,
        options,
      )
    }

    return this.selectorModule.createSelector(
      selectorOrDeps,
      resultFnOrOptions as SelectorOptions<R>,
    )
  }

  private async notifySubscribers(value: T): Promise<void> {
    await Promise.all(
      Array.from(this.subscriptions).map((subscriber) => subscriber.notify(value)),
    )
  }
}

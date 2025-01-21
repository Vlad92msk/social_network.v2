import { Inject, Injectable } from '@ui/modules/synapse/decorators'
import { BaseModule } from '@ui/modules/synapse/services/core/base.service'
import type { IDIContainer } from '@ui/modules/synapse/services/di-container/di-container.interface'
import { DIContainer } from '@ui/modules/synapse/services/di-container/di-container.service'

@Injectable()
export class CounterModule extends BaseModule {
  readonly name = 'counter'
  private value = 0
  private subscribers = new Set<(value: number) => void>()

  constructor(
    @Inject('container') container: IDIContainer,  // Добавляем явный токен для container
    @Inject('COUNTER_CONFIG') private readonly config: { initialValue: number }
  ) {
    super(container)
    this.value = config.initialValue
  }

  static create(config: { initialValue: number }, parentContainer?: IDIContainer): CounterModule {
    const container = new DIContainer({ parent: parentContainer })

    // Регистрируем container как сервис
    container.register({
      id: 'container',
      instance: container
    })

    // Регистрируем конфиг
    container.register({
      id: 'COUNTER_CONFIG',
      instance: config
    })

    // Регистрируем модуль
    container.register({
      id: 'CounterModule',
      type: CounterModule
    })

    return container.resolve(CounterModule)
  }
  getValue(): number {
    return this.value
  }

  increment(): number {
    this.value++
    // Уведомляем подписчиков
    this.notifySubscribers()
    return this.value
  }

  // Система подписки
  subscribe(callback: (value: number) => void): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.value)
    }
  }

  protected async registerServices(): Promise<void> {
    this.container.register({ id: 'counter', instance: this })
  }

  protected async setupEventHandlers(): Promise<void> {}
  protected async cleanupResources(): Promise<void> {
    this.subscribers.clear()
  }
}

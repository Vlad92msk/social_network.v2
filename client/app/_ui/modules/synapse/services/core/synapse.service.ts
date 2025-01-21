import { IEventBus } from '@ui/modules/synapse/services/event-bus/event-bus.interface'
import { BaseModule } from './base.service'
import type { IDIContainer } from '../di-container/di-container.interface'
import { DIContainer } from '../di-container/di-container.service'
import { IStorageConfig } from '../storage/storage.interface'
import { StorageModule } from '../storage/storage.service'

export class Synapse extends BaseModule {
  readonly name = 'synapse'

  constructor(container: IDIContainer) {
    super(container)
  }

  // Когда Synapse самостоятельный модуль (+ убираем Injectable)
  static create(parentContainer?: IDIContainer): Synapse {
    const container = new DIContainer({ parent: parentContainer })
    return new Synapse(container)
  }

  // Когда Synapse часть другого модуля (+ Injectable)
  // static create(parentContainer?: IDIContainer): Synapse {
  //   const container = new DIContainer({ parent: parentContainer })
  //   return container.resolve(Synapse)
  // }

  withStorage(config: IStorageConfig): this {
    try {
      if (this.container.has('storage')) {
        return this
      }

      const storageModule = StorageModule.create(config, this.container)
      this.registerChildModule('storage', storageModule)
      return this
    } catch (error) {
      throw new Error(`Failed to initialize storage module: ${error.message}`)
    }
  }

  protected async registerServices(): Promise<void> {}

  protected async setupEventHandlers(): Promise<void> {
    const eventBus = this.container.get<IEventBus>('eventBus')

    // Подписываемся на события очистки
    eventBus.subscribe('app:cleanup', async () => {
      await this.cleanupResources()
    })

    // Подписываемся на системные события
    // this.eventBus.subscribe('system:error', this.handleSystemError)
    // this.eventBus.subscribe('network:status', this.handleNetworkStatus)
    //
    // // Синхронизация между вкладками
    // window.addEventListener('storage', this.handleStorageEvent)
    //
    // // Обработка выгрузки страницы
    // window.addEventListener('beforeunload', this.handleBeforeUnload)
    //
    // // Можем создать свой канал событий
    // this.broadcastChannel = new BroadcastChannel('synapse')
    // this.broadcastChannel.onmessage = this.handleBroadcastMessage
  }

  protected async cleanupResources(): Promise<void> {
    // Очищаем ресурсы storage если он есть
  }

  async build() {
    const storage = this.getChildModule<StorageModule>('storage')
    if (!storage) {
      throw new Error('Storage module is required but not initialized')
    }

    // Сначала инициализация:
    // - registerServices зарегистрирует все сервисы
    // - setupEventHandlers настроит все обработчики
    // - рекурсивно инициализирует все дочерние модули
    await this.initialize()

    // После этого можем вернуть полностью инициализированные модули
    return { storage }
  }
}

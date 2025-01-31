import { Middleware, MiddlewareFactory, MiddlewareOptions, NextFunction, OperationType, StorageContext } from '@ui/modules/synapse/services/core/core.interface'
import { SyncMessage } from '@ui/modules/synapse/services/state-sync/state-sync.interface'

export interface StateSyncMiddlewareOptions extends MiddlewareOptions {
  channelName?: string;
  debug?: boolean;
  excludeOperations?: OperationType[];
}

export const createStateSyncMiddleware: MiddlewareFactory<StateSyncMiddlewareOptions> = (
  options: StateSyncMiddlewareOptions = {},
) => {
  const {
    channelName = 'app_state_sync',
    debug = false,
    excludeOperations = ['get', 'keys'],
    segments = [],
  } = options

  const channel = new BroadcastChannel(channelName)
  const tabId = crypto.randomUUID()

  const log = (...args: any[]) => {
    if (debug) {
      console.log('[StateSyncMiddleware]', ...args)
    }
  }

  // Обработчик входящих сообщений
  channel.onmessage = async (event: MessageEvent<SyncMessage>) => {
    const message = event.data
    if (message.tabId === tabId) return

    log('Received message:', message)
  }

  const middleware: Middleware = (next: NextFunction) => async (context: StorageContext) => {
    // Пропускаем исключенные операции
    if (excludeOperations.includes(context.type)) {
      return next(context)
    }

    const result = await next(context)

    // Отправляем сообщение другим вкладкам
    const message: SyncMessage = {
      //@ts-ignore
      type: `state:${context.type}`,
      key: context.key,
      value: context.value,
      timestamp: Date.now(),
      tabId,
    }

    log('Broadcasting:', message)
    channel.postMessage(message)

    return result
  }

  // Добавляем опции и cleanup метод
  middleware.options = { segments }
  channel.close()
  return middleware
}

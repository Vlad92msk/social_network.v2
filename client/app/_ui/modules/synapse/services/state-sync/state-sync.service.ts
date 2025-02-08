import { StorageEvents, StorageType } from '../storage/storage.interface'
import { Middleware, MiddlewareAPI, NextFunction, StorageAction } from '../storage/utils/middleware-module'

interface SharedStateMiddlewareProps {
  storageType: StorageType
  storageName: string
}

interface BroadcastMessage {
  type: string
  key?: string
  value: any
  source: 'broadcast'
  timestamp: number
}

export const createSharedStateMiddleware = (props: SharedStateMiddlewareProps): Middleware => {
  const { storageName, storageType } = props
  const channelName = `${storageType}-${storageName}`
  const channel = new BroadcastChannel(channelName)
  channel.onmessageerror = (event) => {
    console.error(`[${channelName}] Ошибка в канале:`, event)
  }

  console.log(`channel[${channelName}] инициализирован`)

  // Setup функция, которая будет вызвана при инициализации
  const setup = (api: MiddlewareAPI) => {
    channel.onmessage = async (event) => {
      const message = event.data as BroadcastMessage

      console.log(`[${channelName}] Получено сообщение:`, message)

      if (storageType === 'memory') {
        //@ts-ignore
        switch (message.type) {
          case 'set':
            //@ts-ignore
            await api.storage.doSet(message.key, message.value)
            break
          case 'delete':
            //@ts-ignore
            await api.storage.doDelete(message.key)
            break
          case 'clear':
            await api.storage.doClear()
            break
        }
      }

      if (['set', 'update'].includes(message.type)) {
        console.log(`[${channelName}] Уведомляем подписчиков:`, message)
        //@ts-ignore
        api.storage.notifySubscribers(message.key, message.value)
        api.storage.notifySubscribers('*', {
          type: StorageEvents.STORAGE_UPDATE,
          key: message.key,
          value: message.value,
          source: message.source,
          timestamp: message.timestamp,
        })
      }
    }

    console.log(`[${channelName}] Канал создан и готов к использованию(обработчик установлен)`)
  }

  // Reducer функция для обработки действий
  const reducer = (api: MiddlewareAPI) => (next: NextFunction) => async (action: StorageAction) => {
    const result = await next(action)

    console.log('action', action)
    if (['set', 'delete', 'clear'].includes(action.type)) {
      const timestamp = Date.now()
      const message: BroadcastMessage = {
        type: action.type,
        key: action.key,
        value: action.value,
        source: 'broadcast',
        timestamp,
      }

      console.log(`[${channelName}] Отправляем сообщение:`, message)
      channel.postMessage(message)
    }

    return result
  }

  return {
    setup,
    reducer,
  }
}

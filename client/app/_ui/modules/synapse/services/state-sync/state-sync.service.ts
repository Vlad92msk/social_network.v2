import { StorageType } from '../storage/storage.interface'
import { Middleware } from '../storage/utils/middleware-module'

interface SharedStateMiddlewareProps {
  storageType: StorageType
  storageName: string
}

export const createSharedStateMiddleware = (props: SharedStateMiddlewareProps): Middleware => {
  const { storageName, storageType } = props
  const channel = new BroadcastChannel(`${storageType}-${storageName}`)

  return (api) => {
    // Подписываемся на внешние события при создании middleware
    channel.onmessage = async (event) => {
      const { key, value, type, source, timestamp } = event.data

      // Для memory-хранилища обновляем данные
      if (storageType === 'memory') {
        switch (type) {
          case 'set':
            await api.storage.doSet(key, value)
            break
          case 'delete':
            await api.storage.doDelete(key)
            break
          case 'clear':
            await api.storage.doClear()
            break
        }
      }

      // Для всех типов хранилищ уведомляем подписчиков
      if (type === 'set') {
        // Уведомляем подписчиков конкретного ключа
        api.storage.notifySubscribers(key, value)
        // Уведомляем глобальных подписчиков
        api.storage.notifySubscribers('*', {
          type: 'set',
          key,
          value,
          source,
          timestamp,
        })
      } else if (type === 'delete') {
        api.storage.notifySubscribers(key, undefined)
        api.storage.notifySubscribers('*', {
          type: 'delete',
          key,
          source,
          timestamp,
        })
      } else if (type === 'clear') {
        api.storage.notifySubscribers('*', {
          type: 'clear',
          source,
          timestamp,
        })
      }
    }

    // Возвращаем функцию middleware
    return (next) => async (action) => {
      const result = await next(action)

      // Отправляем изменения в канал только для определенных операций
      if (['set', 'delete', 'clear'].includes(action.type)) {
        channel.postMessage({
          type: action.type,
          key: action.key,
          value: action.value,
          source: 'broadcast',
          timestamp: Date.now(),
        })
      }

      return result
    }
  }
}

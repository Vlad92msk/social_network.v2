import { IStorage, Middleware, NextFunction, StorageChangeEvent, StorageContext, StorageType } from '../storage/storage.interface'

export const createSharedStateMiddleware = (storageType: StorageType): Middleware => {
  const channel = new BroadcastChannel(`storage-sync:${storageType}`)
  let storage: IStorage | null = null

  const handleMessage = async (event: MessageEvent<StorageChangeEvent>) => {
    if (storage && event.data.storageName === storage.name) {
      await storage.handleExternalChange(event.data)
    }
  }

  return (context: StorageContext) => {
    if (!storage && context.storage) {
      storage = context.storage
      channel.addEventListener('message', handleMessage)

      const originalDestroy = storage.destroy.bind(storage)
      storage.destroy = async () => {
        channel.removeEventListener('message', handleMessage)
        channel.close()
        await originalDestroy()
      }
    }

    return async (next: NextFunction) => {
      const result = await next(context)

      if ((context.type === 'set' || context.type === 'delete' || context.type === 'clear')
        && context.storage) {
        channel.postMessage({
          type: context.type,
          key: context.key,
          value: context.type === 'set' ? context.value : undefined,
          source: 'broadcast',
          timestamp: Date.now(),
          storageName: context.storage.name
        } satisfies StorageChangeEvent)
      }

      return result
    }
  }
}

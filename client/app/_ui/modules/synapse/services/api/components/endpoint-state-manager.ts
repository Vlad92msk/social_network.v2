import { StorageManager } from './storage-manager'
import { EndpointState, Unsubscribe } from '../types/api.interface'

// 2. EndpointStateManager.ts - управление состоянием эндпоинтов
export class EndpointStateManager {
  constructor(private storageManager: StorageManager) {}

  public async updateEndpointState<T>(
    endpointName: string,
    update: Partial<EndpointState<T>>,
  ): Promise<void> {
    const current = await this.storageManager.get<EndpointState<T>>(`endpoint:${endpointName}`)

    if (!current) {
      // Создаем начальное состояние если оно отсутствует
      const initialState = {
        status: 'idle',
        meta: {
          tags: [],
          invalidatesTags: [],
          cache: {},
        },
        ...update,
      } as EndpointState<T>
      return this.storageManager.set(`endpoint:${endpointName}`, initialState)
    }

    // Обновляем состояние
    return this.storageManager.set(`endpoint:${endpointName}`, {
      ...current,
      ...update,
    })
  }

  public async getEndpointState<T>(endpointName: string, initialState: EndpointState<T>): Promise<EndpointState<T>> {
    const state = await this.storageManager.get<EndpointState<T>>(`endpoint:${endpointName}`)
    return state || initialState
  }

  public subscribeToEndpointState<T>(endpointName: string, callback: (state: EndpointState<T>) => void): Unsubscribe {
    return this.storageManager.subscribe(`endpoint:${endpointName}`, callback)
  }
}

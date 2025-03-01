import { QueryStorage } from './query-storage'
import { EndpointState } from '../types/api.interface'

/**
 * Менеджер состояния эндпоинтов
 */
export class EndpointStateManager {
  /** Кэш состояний эндпоинтов в памяти */
  private stateCache: Map<string, EndpointState<any>> = new Map()

  /** Обработчики изменения состояний */
  private changeHandlers: Map<string, Set<(state: EndpointState<any>) => void>> = new Map()

  /**
   * Создает новый экземпляр менеджера состояния
   * @param storageManager Менеджер хранилища
   */
  constructor(private storageManager: QueryStorage) {}

  /**
   * Получает состояние эндпоинта
   * @param endpointName Имя эндпоинта
   * @returns Состояние эндпоинта
   */
  public async getEndpointState<T>(endpointName: string): Promise<EndpointState<T>> {
    // Проверяем кэш в памяти
    if (this.stateCache.has(endpointName)) {
      return this.stateCache.get(endpointName) as EndpointState<T>
    }

    // Пробуем получить из хранилища
    try {
      const storage = this.storageManager.getStorage()

      if (storage) {
        const storedState = await storage.get<EndpointState<T>>(`endpoint:${endpointName}`)

        if (storedState) {
          // Кэшируем в памяти
          this.stateCache.set(endpointName, storedState)
          return storedState
        }
      }
    } catch (error) {
      console.error(`Ошибка чтения состояния эндпоинта ${endpointName}:`, error)
    }

    // Если не удалось получить, создаем состояние по умолчанию
    const defaultState: EndpointState<T> = { status: 'idle' }

    // Кэшируем в памяти
    this.stateCache.set(endpointName, defaultState)
    return defaultState
  }

  /**
   * Обновляет состояние эндпоинта
   * @param endpointName Имя эндпоинта
   * @param state Новое состояние (частичное)
   * @returns Обновленное состояние
   */
  public async updateEndpointState<T>(
    endpointName: string,
    state: Partial<EndpointState<T>>,
  ): Promise<EndpointState<T>> {
    // Получаем текущее состояние
    const currentState = await this.getEndpointState<T>(endpointName)

    // Объединяем с новым
    const newState: EndpointState<T> = {
      ...currentState,
      ...state,
      // Добавляем метаданные, если они были в старом состоянии
      meta: {
        ...(currentState.meta || {}),
        ...(state.meta || {}),
      },
    }

    // Сохраняем в кэше
    this.stateCache.set(endpointName, newState)

    // Сохраняем в хранилище
    try {
      const storage = this.storageManager.getStorage()

      if (storage) {
        await storage.set(`endpoint:${endpointName}`, newState)
      }
    } catch (error) {
      console.error(`Ошибка сохранения состояния эндпоинта ${endpointName}:`, error)
    }

    // Оповещаем подписчиков
    this.notifyStateChange(endpointName, newState)

    return newState
  }

  /**
   * Сбрасывает состояние эндпоинта
   * @param endpointName Имя эндпоинта
   */
  public async resetEndpointState(endpointName: string): Promise<void> {
    // Удаляем из кэша
    this.stateCache.delete(endpointName)

    // Удаляем из хранилища
    try {
      const storage = this.storageManager.getStorage()

      if (storage) {
        await storage.delete(`endpoint:${endpointName}`)
      }
    } catch (error) {
      console.error(`Ошибка удаления состояния эндпоинта ${endpointName}:`, error)
    }

    // Оповещаем подписчиков о сбросе
    this.notifyStateChange(endpointName, { status: 'idle' })
  }

  /**
   * Подписка на изменение состояния эндпоинта
   * @param endpointName Имя эндпоинта
   * @param handler Обработчик изменения
   * @returns Функция отписки
   */
  public subscribeToState<T>(
    endpointName: string,
    handler: (state: EndpointState<T>) => void,
  ): () => void {
    // Создаем набор обработчиков для эндпоинта, если его нет
    if (!this.changeHandlers.has(endpointName)) {
      this.changeHandlers.set(endpointName, new Set())
    }

    // Получаем набор обработчиков
    const handlers = this.changeHandlers.get(endpointName)!

    // Добавляем обработчик
    handlers.add(handler as (state: EndpointState<any>) => void)

    // Сразу оповещаем о текущем состоянии
    this.getEndpointState<T>(endpointName).then((state) => {
      try {
        handler(state)
      } catch (error) {
        console.error(`Ошибка в обработчике состояния для ${endpointName}:`, error)
      }
    })

    // Возвращаем функцию отписки
    return () => {
      const handlersSet = this.changeHandlers.get(endpointName)

      if (handlersSet) {
        handlersSet.delete(handler as (state: EndpointState<any>) => void)

        // Если обработчиков больше нет, удаляем набор
        if (handlersSet.size === 0) {
          this.changeHandlers.delete(endpointName)
        }
      }
    }
  }

  /**
   * Оповещает подписчиков об изменении состояния
   * @param endpointName Имя эндпоинта
   * @param state Новое состояние
   */
  private notifyStateChange(endpointName: string, state: EndpointState<any>): void {
    const handlers = this.changeHandlers.get(endpointName)

    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(state)
        } catch (error) {
          console.error(`Ошибка в обработчике состояния для ${endpointName}:`, error)
        }
      })
    }
  }

  /**
   * Очищает кэш состояний в памяти
   */
  public clearCache(): void {
    this.stateCache.clear()
  }
}

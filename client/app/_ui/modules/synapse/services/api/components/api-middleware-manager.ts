import {
  ApiEventData, ApiEventType, apiLogger, ApiMiddlewareAPI, ApiMiddlewareContext, EnhancedApiMiddleware, RequestOptions,
} from '@ui/modules/synapse/services/api'

/**
 * Менеджер middleware для API клиента с поддержкой цепочки вызовов
 */
export class ApiMiddlewareManager {
  /** Массив middleware */
  private middlewares: EnhancedApiMiddleware[] = []

  /** Флаг инициализации цепочки middleware */
  private initialized = false

  /** Функция диспетчеризации запроса */
  private executeFn!: (context: ApiMiddlewareContext) => Promise<any>

  /** Ссылка на API для middleware */
  private api: ApiMiddlewareAPI

  /**
   * Создает новый экземпляр менеджера middleware
   * @param emitEventFn Функция для генерации событий
   */
  constructor(emitEventFn?: (eventType: ApiEventType, data: ApiEventData) => void) {
    // Инициализируем API для middleware
    this.api = {
      execute: async (context: ApiMiddlewareContext) => this.execute(context),
      getGlobalOptions: () => ({}),
      updateOptions: (context: ApiMiddlewareContext, newOptions: Partial<RequestOptions>) => {
        context.options = { ...context.options, ...newOptions }
      },
      emitEvent: emitEventFn || ((eventType, data) => {
        // Пустая реализация по умолчанию
      }),
    }
  }

  /**
   * Устанавливает функцию для получения глобальных опций
   * @param getGlobalOptions Функция получения глобальных опций
   */
  public setGlobalOptionsProvider(getGlobalOptions: () => RequestOptions): void {
    this.api.getGlobalOptions = getGlobalOptions
  }

  /**
   * Устанавливает функцию для генерации событий
   * @param emitEventFn Функция генерации событий
   */
  public setEventEmitter(emitEventFn: (eventType: ApiEventType, data: ApiEventData) => void): void {
    this.api.emitEvent = emitEventFn
  }

  /**
   * Базовая операция выполнения запроса (последний шаг цепочки)
   * @param context Контекст middleware
   * @returns Результат выполнения запроса
   */
  private async baseOperation(context: ApiMiddlewareContext): Promise<any> {
    try {
      // Вызываем оригинальную функцию fetch
      return await context.originalFetch(context.params, context.options)
    } catch (error) {
      apiLogger.error(`Ошибка в базовой операции для ${context.endpointName}`, error)
      throw error
    }
  }

  /**
   * Инициализирует цепочку middleware
   */
  private initializeMiddlewares(): void {
    if (this.initialized) return

    // Начинаем с базовой операции
    let chain = this.baseOperation.bind(this)

    // Строим цепочку middleware в обратном порядке (от последнего к первому)
    // Это обеспечивает правильный порядок выполнения: первый добавленный middleware
    // будет первым в цепочке обработки запроса
    for (const middleware of [...this.middlewares].reverse()) {
      if (middleware.process) {
        // Если middleware поддерживает цепочку, используем его process функцию
        const nextChain = chain
        chain = async (context) => {
          try {
            return await middleware.process!(this.api)(nextChain)(context)
          } catch (error) {
            apiLogger.error(`Ошибка в middleware ${middleware.name}`, error)
            throw error
          }
        }
      } else {
        // Для обратной совместимости с обычными middleware используем legacy адаптер
        const nextChain = chain
        chain = async (context) => {
          try {
            // Вызываем before middleware если есть
            if (middleware.before) {
              await middleware.before(context)
            }

            // Вызываем следующий middleware в цепочке
            let result = await nextChain(context)

            // Вызываем after middleware если есть
            if (middleware.after) {
              const newResult = await middleware.after({
                ...context,
                result,
              })

              // Обновляем результат, если middleware вернул новое значение
              if (newResult !== undefined) {
                result = newResult
              }
            }

            return result
          } catch (error) {
            // Вызываем onError middleware если есть
            if (middleware.onError) {
              await middleware.onError({
                ...context,
                error: error as Error,
              })
            }

            throw error
          }
        }
      }
    }

    // Устанавливаем финальную функцию выполнения
    this.executeFn = chain
    this.initialized = true
  }

  /**
   * Добавляет middleware для перехвата запросов
   * @param middleware Объект middleware
   * @returns this для цепочки вызовов
   */
  public use(middleware: EnhancedApiMiddleware): this {
    // Проверяем, что middleware имеет имя
    if (!middleware.name) {
      middleware.name = `anonymous-${this.middlewares.length}`
    }

    // Вызываем setup функцию если есть
    if (middleware.setup) {
      middleware.setup(this.api)
    }

    // Добавляем middleware в список
    this.middlewares.push(middleware)

    // Сбрасываем флаг инициализации для перестроения цепочки
    this.initialized = false

    return this
  }

  /**
   * Удаляет middleware по имени
   * @param name Имя middleware
   * @returns true если middleware был удален, иначе false
   */
  public remove(name: string): boolean {
    const index = this.middlewares.findIndex((mw) => mw.name === name)
    if (index === -1) return false

    // Вызываем cleanup функцию если есть
    const middleware = this.middlewares[index]
    if (middleware.cleanup) {
      middleware.cleanup()
    }

    // Удаляем middleware из списка
    this.middlewares.splice(index, 1)

    // Сбрасываем флаг инициализации для перестроения цепочки
    this.initialized = false

    return true
  }

  /**
   * Удаляет все middleware
   */
  public clear(): void {
    // Вызываем cleanup функцию для всех middleware
    for (const middleware of this.middlewares) {
      if (middleware.cleanup) {
        middleware.cleanup()
      }
    }

    // Очищаем список middleware
    this.middlewares = []

    // Сбрасываем флаг инициализации
    this.initialized = false
  }

  /**
   * Выполняет запрос через цепочку middleware
   * @param context Контекст middleware
   * @returns Результат выполнения запроса
   */
  public async execute(context: ApiMiddlewareContext): Promise<any> {
    // Инициализируем цепочку middleware если нужно
    if (!this.initialized) {
      this.initializeMiddlewares()
    }

    try {
      // Выполняем запрос через цепочку middleware
      return await this.executeFn(context)
    } catch (error) {
      apiLogger.error(`Ошибка в цепочке middleware для ${context.endpointName}`, error)
      throw error
    }
  }

  /**
   * Возвращает все зарегистрированные middleware
   * @returns Массив middleware
   */
  public getMiddlewares(): EnhancedApiMiddleware[] {
    return [...this.middlewares]
  }

  /**
   * Проверяет, есть ли middleware с указанным именем
   * @param name Имя middleware
   * @returns true если middleware найден, иначе false
   */
  public hasMiddleware(name: string): boolean {
    return this.middlewares.some((mw) => mw.name === name)
  }
}

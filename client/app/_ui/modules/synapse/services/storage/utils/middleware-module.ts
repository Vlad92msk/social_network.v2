// middleware.types.ts
export type StorageActionType =
  | 'get'
  | 'set'
  | 'delete'
  | 'clear'
  | 'init'
  | 'keys'
  | 'external'
  | 'update';

export type StorageAction = {
  type: StorageActionType
  key?: string
  value?: any
  metadata?: Record<string, any>
  source?: string
  timestamp?: number
};

export type MiddlewareAPI = {
  dispatch: (action: StorageAction) => Promise<any>
  getState: () => Promise<Record<string, any>>
  storage: {
    doGet: (key: string) => Promise<any>
    doSet: (key: string, value: any) => Promise<void>
    doDelete: (key: string) => Promise<boolean>
    doClear: () => Promise<void>
    doKeys: () => Promise<string[]>
    notifySubscribers: (key: string, value: any) => void
  }
}

export type NextFunction = (action: StorageAction) => Promise<any>;

// Новый тип для настройки событий
export type SetupEventsFunction = (api: MiddlewareAPI) => void;

// Обновленный тип Middleware
export type Middleware = {
  setup?: SetupEventsFunction;
  reducer: (api: MiddlewareAPI) => (next: NextFunction) => (action: StorageAction) => Promise<any>;
}

export class MiddlewareModule {
  private middlewares: Middleware[] = []
  private api: MiddlewareAPI
  private initialized = false

  constructor(storage: any) {
    this.api = {
      dispatch: async (action: StorageAction) => this.dispatch(action),
      getState: async () => storage.getState(),
      storage: {
        doGet: storage.doGet.bind(storage),
        doSet: storage.doSet.bind(storage),
        doDelete: storage.doDelete.bind(storage),
        doClear: storage.doClear.bind(storage),
        doKeys: storage.doKeys.bind(storage),
        notifySubscribers: storage.notifySubscribers.bind(storage),
      },
    }
  }

  private initializeMiddlewares() {
    if (this.initialized) return

    const baseOperation: NextFunction = async (action: StorageAction) => {
      switch (action.type) {
        case 'get': return this.api.storage.doGet(action.key!)
        case 'set':
          await this.api.storage.doSet(action.key!, action.value)
          return action.value
        case 'delete': return this.api.storage.doDelete(action.key!)
        case 'clear': return this.api.storage.doClear()
        case 'external':
          return action.value
        case 'init':
        case 'update':
          if (action.value) await this.api.storage.doSet('', action.value)
          return action.value
        case 'keys': return this.api.storage.doKeys()
        default: throw new Error(`Unknown action type: ${action.type}`)
      }
    }

    let chain = baseOperation
    for (const middleware of this.middlewares.reverse()) {
      const nextChain = chain
      chain = async (action) => {
        const next = (a: StorageAction) => nextChain(a)
        return middleware.reducer(this.api)(next)(action)
      }
    }

    this.dispatch = chain
    this.initialized = true
  }

  use(middleware: Middleware): void {
    // Сразу вызываем setup при добавлении middleware
    if (middleware.setup) {
      middleware.setup(this.api)
    }

    this.middlewares.push(middleware)
    this.initialized = false
  }

  async dispatch(action: StorageAction): Promise<any> {
    if (!this.initialized) {
      this.initializeMiddlewares()
    }
    return this.dispatch(action)
  }
}

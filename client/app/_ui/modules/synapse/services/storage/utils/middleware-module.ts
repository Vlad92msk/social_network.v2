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
  type: StorageActionType;
  key?: string;
  value?: any;
  metadata?: Record<string, any>;
  source?: string;
  timestamp?: number;
};

export type MiddlewareAPI = {
  dispatch: (action: StorageAction) => Promise<any>;
  getState: () => Promise<Record<string, any>>;
  storage: {
    doGet: (key: string) => Promise<any>;
    doSet: (key: string, value: any) => Promise<void>;
    doDelete: (key: string) => Promise<boolean>;
    doClear: () => Promise<void>;
    doKeys: () => Promise<string[]>;
    notifySubscribers: (key: string, value: any) => void;
  };
};

export type NextFunction = (action: StorageAction) => Promise<any>;

export type Middleware = (api: MiddlewareAPI) =>
  (next: NextFunction) =>
    (action: StorageAction) => Promise<any>;

// middleware-module.ts
export class MiddlewareModule {
  private middlewares: Middleware[] = []

  private api: MiddlewareAPI

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

  use(middleware: Middleware): void {
    this.middlewares.push(middleware)
  }

  async dispatch(action: StorageAction): Promise<any> {
    // Создаем цепочку middleware
    const chain = this.middlewares
      .map((middleware) => middleware(this.api))
      .reduce((prev, current) => (next: NextFunction) => prev((action) => current(next)(action)))

    // Базовая операция
    const baseOperation: NextFunction = async (action: StorageAction) => {
      switch (action.type) {
        case 'get':
          return this.api.storage.doGet(action.key!)
        case 'set':
          await this.api.storage.doSet(action.key!, action.value)
          return action.value
        case 'delete':
          return this.api.storage.doDelete(action.key!)
        case 'clear':
          return this.api.storage.doClear()
        case 'external':
          this.api.storage.notifySubscribers(action.key!, action.value)
          return action.value
        case 'init':
          if (action.value) {
            await this.api.storage.doSet('', action.value)
          }
          return action.value
        case 'keys':
          return this.api.storage.doKeys()
        case 'update':
          // Обработка обновления состояния
          if (action.value) {
            await this.api.storage.doSet('', action.value)
          }
          return action.value
        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }
    }

    return chain(baseOperation)(action)
  }
}

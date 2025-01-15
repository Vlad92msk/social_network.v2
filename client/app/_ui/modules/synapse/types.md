### Middleware
```typescript
// Общий тип для контекста
interface MiddlewareContext<T> {
  state: StateStore;
  logger: LoggerService;
  eventBus: SegmentedEventBus;
  config: T;
}

// State Middleware
interface StateMiddlewareHandlers {
  beforeSet?: (key: string, newValue: any, oldValue: any) => any;
  afterSet?: (key: string, value: any) => void;
  beforeGet?: (key: string) => string;
  afterGet?: (key: string, value: any) => any;
}

type StateMiddleware = (
  context: MiddlewareContext<StateConfig>
) => (next: (handlers: StateMiddlewareHandlers) => void) => void;

// Query Middleware
interface QueryMiddlewareHandlers {
  beforeExecute?: (query: QueryConfig) => QueryConfig | Promise<QueryConfig>;
  afterExecute?: (response: any, query: QueryConfig) => any;
  onError?: (error: Error, query: QueryConfig) => void;
}

type QueryMiddleware = (
  context: MiddlewareContext<QueryConfig>
) => (next: (handlers: QueryMiddlewareHandlers) => void) => void;

// Worker Middleware
interface WorkerMiddlewareHandlers {
  beforeMessage?: (message: any, workerName: string) => any;
  afterMessage?: (message: any, workerName: string) => any;
  onError?: (error: Error, workerName: string) => void;
}

type WorkerMiddleware = (
  context: MiddlewareContext<WorkerConfig>
) => (next: (handlers: WorkerMiddlewareHandlers) => void) => void;
```


### Synapse
```typescript
interface ISynapse {
  readonly state: StateModule;
  readonly query: QueryModule;
  readonly worker: WorkerModule;
  readonly effects: EffectsModule;
  
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Методы для работы с плагинами
  use(plugin: SynapsePlugin): void;
  
  // Утилиты
  destroy(): Promise<void>;
  reset(): Promise<void>;
}
```

### SynapseBuilder
```typescript
interface SynapseBuilderConfig {
  storage?: StorageConfig;
  worker?: WorkerConfig;
  query?: QueryConfig;
  plugins?: PluginsConfig;
  middlewares?: MiddlewaresConfig;
  effects?: Effect[];
}

class SynapseBuilder {
  private config: SynapseBuilderConfig = {};
  
  withStorage(config: StorageConfig): this;
  withWorker(config: WorkerConfig): this;
  withQuery(config: QueryConfig): this;
  withPlugins(plugins: PluginsConfig): this;
  withMiddlewares(middlewares: MiddlewaresConfig): this;
  withEffects(effects: Effect[]): this;
  
  build(): ISynapse;
}
```

### DI
```typescript
import 'reflect-metadata';

// Декораторы для DI
const Injectable = (): ClassDecorator => {
  return (target: any) => {
    Reflect.defineMetadata('injectable', true, target);
  };
};

const Inject = (): ParameterDecorator => {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const dependencies = Reflect.getMetadata('design:paramtypes', target) || [];
    Reflect.defineMetadata('inject', dependencies, target);
  };
};

// DI Container
@Injectable()
class Container {
  private static instance: Container;
  private dependencies: Map<string, any> = new Map();

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register<T>(token: string, dependency: T): void {
    this.dependencies.set(token, dependency);
  }

  resolve<T>(target: new (...args: any[]) => T): T {
    const tokens = Reflect.getMetadata('inject', target) || [];
    const injections = tokens.map((token: string) => this.dependencies.get(token));
    return new target(...injections);
  }
}

// Пример использования в модулях
@Injectable()
class StateModule {
  constructor(
    @Inject() private eventBus: SegmentedEventBus,
    @Inject() private logger: LoggerService
  ) {}
}

@Injectable()
class QueryModule {
  constructor(
    @Inject() private eventBus: SegmentedEventBus,
    @Inject() private state: StateModule
  ) {}
}

// Базовый класс для модулей с поддержкой DI
@Injectable()
abstract class BaseModule {
  protected container: Container;

  constructor() {
    this.container = Container.getInstance();
  }

  abstract init(): Promise<void>;
  abstract destroy(): Promise<void>;
}
```


### State
```typescript
interface StateConfig<T> {
  name: string;
  initialState: T;
  validators?: Array<(state: T) => boolean>;
  transformers?: Array<(state: T) => T>;
}

class StateStore {
  private store: Map<string, any> = new Map();
  private subscriptions: Map<string, Set<(state: any) => void>> = new Map();
  private transformers: Map<string, Array<(state: any) => any>> = new Map();

  async setState<T>(key: string, value: T, config?: Partial<StateConfig<T>>): Promise<void> {
    // Применяем трансформации если есть
    let transformedValue = value;
    if (config?.transformers) {
      this.transformers.set(key, config.transformers);
      transformedValue = config.transformers.reduce(
        (state, transformer) => transformer(state),
        value
      );
    }

    // Валидируем если нужно
    if (config?.validators) {
      const isValid = config.validators.every(validator => validator(transformedValue));
      if (!isValid) {
        throw new Error(`Invalid state for key: ${key}`);
      }
    }

    this.store.set(key, transformedValue);
    this.notify(key, transformedValue);
  }

  async getState<T>(key: string): Promise<T> {
    return this.store.get(key);
  }

  subscribe<T>(key: string, callback: (state: T) => void): () => void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)?.add(callback);

    return () => {
      this.subscriptions.get(key)?.delete(callback);
    };
  }

  private notify(key: string, value: any): void {
    this.subscriptions.get(key)?.forEach(callback => callback(value));
  }
}

// Пример использования:
const store = new StateStore();

// Создание состояния с валидацией и трансформацией
await store.setState('todos', [], {
  validators: [
    (state) => Array.isArray(state),
    (state) => state.every(todo => todo.hasOwnProperty('id'))
  ],
  transformers: [
    (state) => state.map(todo => ({ ...todo, updatedAt: Date.now() }))
  ]
});

// Подписка на изменения
const unsubscribe = store.subscribe('todos', (todos) => {
  console.log('Todos updated:', todos);
});
```

### State2
Хорошо, давайте разработаем интерфейсы и реализацию для этих методов работы с состоянием:

```typescript
// Типы для селекторов и подписок
type Selector<TState, TResult> = (state: TState) => TResult;
type Subscriber<T> = (value: T) => void;

// Интерфейс для методов работы с состоянием
interface StateMethods<TState> {
  getState<T>(path: string): Promise<T>;
  setState<T>(path: string, value: T): Promise<void>;
  updateState<T>(path: string, updater: (currentValue: T) => T): Promise<void>;
  subscribe<T>(path: string, subscriber: Subscriber<T>): () => void;
  subscribe<T, R>(selector: Selector<TState, R>, subscriber: Subscriber<R>): () => void;
}

// Вспомогательные функции для работы с путями в состоянии
class StatePathUtils {
  static get<T>(obj: any, path: string): T {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  static set(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const lastPart = parts.pop()!;
    const target = parts.reduce((acc, part) => {
      if (!(part in acc)) acc[part] = {};
      return acc[part];
    }, obj);
    target[lastPart] = value;
  }
}

// Реализация методов работы с состоянием
class StateMethodsImpl<TState> implements StateMethods<TState> {
  private state: TState;
  private subscribers: Map<string, Set<Subscriber<any>>> = new Map();
  private selectorSubscribers: Set<{
    selector: Selector<TState, any>;
    subscriber: Subscriber<any>;
    lastValue: any;
  }> = new Set();

  constructor(initialState: TState) {
    this.state = initialState;
  }

  async getState<T>(path: string): Promise<T> {
    return StatePathUtils.get<T>(this.state, path);
  }

  async setState<T>(path: string, value: T): Promise<void> {
    StatePathUtils.set(this.state, path, value);
    this.notifySubscribers(path);
    this.notifySelectorSubscribers();
  }

  async updateState<T>(path: string, updater: (currentValue: T) => T): Promise<void> {
    const currentValue = await this.getState<T>(path);
    const newValue = updater(currentValue);
    await this.setState(path, newValue);
  }

  subscribe<T>(pathOrSelector: string | Selector<TState, T>, subscriber: Subscriber<T>): () => void {
    if (typeof pathOrSelector === 'string') {
      return this.subscribeToPath(pathOrSelector, subscriber);
    } else {
      return this.subscribeToSelector(pathOrSelector, subscriber);
    }
  }

  private subscribeToPath<T>(path: string, subscriber: Subscriber<T>): () => void {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path)!.add(subscriber);

    // Немедленно отправляем текущее значение подписчику
    const currentValue = StatePathUtils.get<T>(this.state, path);
    subscriber(currentValue);

    return () => {
      this.subscribers.get(path)?.delete(subscriber);
      if (this.subscribers.get(path)?.size === 0) {
        this.subscribers.delete(path);
      }
    };
  }

  private subscribeToSelector<T>(selector: Selector<TState, T>, subscriber: Subscriber<T>): () => void {
    const subscription = {
      selector,
      subscriber,
      lastValue: selector(this.state)
    };

    this.selectorSubscribers.add(subscription);
    
    // Немедленно отправляем текущее значение подписчику
    subscriber(subscription.lastValue);

    return () => {
      this.selectorSubscribers.delete(subscription);
    };
  }

  private notifySubscribers(path: string): void {
    this.subscribers.get(path)?.forEach(subscriber => {
      const value = StatePathUtils.get(this.state, path);
      subscriber(value);
    });
  }

  private notifySelectorSubscribers(): void {
    this.selectorSubscribers.forEach(subscription => {
      const newValue = subscription.selector(this.state);
      if (newValue !== subscription.lastValue) {
        subscription.lastValue = newValue;
        subscription.subscriber(newValue);
      }
    });
  }
}
```

Основные особенности реализации:

1. Поддержка точечной нотации для доступа к вложенным объектам ('auth.user')
2. Типизация для безопасной работы с данными
3. Два типа подписок:
    - На конкретный путь в состоянии
    - На результат селектора
4. Мемоизация результатов селекторов (отправка обновлений только при изменении значения)
5. Немедленная отправка текущего значения при подписке
6. Автоматическая очистка неиспользуемых подписок

Использование:

```typescript
interface AppState {
  todos: Array<{ id: string; text: string; completed: boolean }>;
  auth: {
    user: { id: string; name: string } | null;
    token: string | null;
  };
}

const stateMethods = new StateMethodsImpl<AppState>({
  todos: [],
  auth: { user: null, token: null }
});

// Примеры использования
await stateMethods.setState('todos', [{ id: '1', text: 'Test', completed: false }]);
const todos = await stateMethods.getState<AppState['todos']>('todos');

// Подписка на путь
const unsubscribe = stateMethods.subscribe('todos', (todos) => {
  console.log('Todos updated:', todos);
});

// Подписка на селектор
const unsubscribeActive = stateMethods.subscribe(
  (state) => state.todos.filter(todo => !todo.completed),
  (activeTodos) => {
    console.log('Active todos:', activeTodos);
  }
);
```


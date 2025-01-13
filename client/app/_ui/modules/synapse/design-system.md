# Synapse-система

### Задача

Создать систему, которая:
- Предоставляет удобное и универсальное API для управления состоянием.
  - Централизованное хранение.
  - реактивность.
- Поддерживает создание запросов:
  - Управление кэшем.
  - Доступ к состоянию.
  - Отдельное место в состоянии для хранения результатов запросов (например "api").
  - Инвалидирование кэша.
  - Конфигурируемые параметры и middleware для запросов.
  - Политики повторных попыток (retry policy).
  - Механизм отмены запросов и очистки ресурсов.
  - многоуровневая система конфигурации:
    - на уровне основного сервиса:
      - передача корневого url.
      - флаг необходимости кэширования.
      - время кэша.
      - сущности на различные жизненные циклы запроса:
        - сущность которая будет отображаться если loading.
        - сущность которая будет отображаться если error.
      - прочие настройки
    - на уровне группы (нечто похожее на createApi из RTK Query)
    - на уровне самого эндроинта
- Имеет многоуровневую систему расширений:
  - Middlewares:
    - Глобальные (для Core Module).
    - Сервисные (для состояния, запросов, кэша и т.д.).
    - Единый интерфейс для их создания.
  - Плагины:
    - Глобальные (для Core Module).
    - Сервисные (для состояния, запросов, кэша и т.д.).
    - Единый интерфейс для их создания.
- Поддерживает гибкие варианты хранения данных:
  - В оперативной памяти (по умолчанию).
  - В localStorage/sessionStorage.
  - В indexDB.
  - Расширяемую систему синхронизации данных.
  - Единый интерфейс доступа к данным через адаптеры.
- Содержит Worker Module:
  - Для работы с ServiceWorkers, SharedWorkers и Broadcast Channel.
  - Поддерживает:
    - Кэширование.
    - Синхронизацию состояния между вкладками.
    - Расширение через плагины.
    - Стратегии fallback при недоступности Worker API.
- Позволяет легко добавлять новые функции:
  - Синхронизация состояния с сервером.
  - Расширение функционала по мере роста приложения.
  - Масштабирование системы с мониторингом метрик.
- Основана на сегментированном EventBus:
  - Приоритизация и фильтрация событий.
  - Управление жизненным циклом модулей и сервисов.
  - Обеспечение реактивности через Observable.
  - Механизм масштабирования при высокой нагрузке.
- Гибкость и модульность:
  - Базовые функции реализованы внутри ядра.
  - Все остальное — через плагины.
- Предоставляет функции для:
  - Добавления глобальных и модульных middlewares.
  - Создания глобальных и модульных плагинов.

## Структура системы

### Модули

1. Core Module

Центральный модуль, отвечающий за:
- Сегментированную коммуникацию между модулями через EventBus.
- Логирование, отладку.
- Инициализацию системы и порядок загрузки модулей.

Компоненты Core Module:
- ServiceContainer: Контейнер для управления сервисами.
- SegmentedEventBus: Система событий с поддержкой приоритетов и сегментации.
- ModuleInitializer: Управление порядком загрузки и инициализации модулей.
- Logger: Гибкая система логирования.

2. StateManagement Module

Модуль для работы с состоянием, обеспечивающий:
- Централизованное хранилище данных.
- Реактивность и подписки на изменения (через Observable).
- Гибкие стратегии кэширования и синхронизации.
- Поддержку разных хранилищ.

Компоненты StateManagement Module:
- StateStore: Основное хранилище состояния с поддержкой реактивности.
- StorageAdapter: Адаптеры для работы с разными типами хранилищ.
- CacheStrategy: Стратегии управления кэшем.

3. Query Module

Модуль для работы с запросами, предоставляющий:
- Удобное построение запросов с кэшированием.
- Middleware для управления поведением запросов.
- Интеграцию с StateStore для хранения и обновления данных.
- Политики повторных попыток и отмены запросов.
- Возможность создания сложной цепочки запросов и подписки на состояния других запросов, например:
  - при подписке на success получения пользователя вызывать другой запрос
  - при подписке на failure получения пользователя вызввать несколько событий (уведомление + еще какой нибудь запрос)
  - иные сценарии суть которых в подписке на одни события, проведения необходимых вычислений (есл нужно) и вызове других событий

Компоненты Query Module:
- QueryManager: Управление запросами.
- QueryBuilder: Конструктор запросов с цепочкой методов.
- QueryExecutor: Выполнение запросов с retry policy и отменой.
- RetryPolicyManager: Управление политиками повторных попыток.

4. Worker Module

Модуль многопоточности, обеспечивающий:
- Работа с WebWorkers, ServiceWorkers и SharedWorkers.
- Обмен сообщениями между потоками через EventBus.
- Синхронизацию состояния между вкладками.
- Стратегии fallback при недоступности Worker API.

Компоненты Worker Module:
- WorkerManager: Управление жизненным циклом воркеров.
- WorkerStrategyManager: Управление стратегиями выполнения задач.
- MessageBroker: Обмен сообщениями между потоками.
- SyncManager: Управление синхронизацией состояния.

Основные связи между модулями:
1. Core → Modules:
  - ModuleInitializer контролирует порядок загрузки.
  - SegmentedEventBus обеспечивает коммуникацию.
  - Передает пользовательские плагины и middlewares в остальные модули и сервисы.
2. StateManagement → Query/Worker:
  - Событийное взаимодействие через сегменты EventBus.




```mermaid
classDiagram
  direction TB
%% Core Module
  namespace Core {

    class SynapseBuilder {
      +withStorage(config: StorageConfig)
      +withWorkers(config: WorkerConfig)
      +withQuery(config: QueryConfig)
      +build(): Synapse
    }
    
    class ModuleInitializer {
      -modules: Map~string, Module~
      -initialized: Set~string~
      +initialize()
      +registerModule(module: Module)
      -initializeModule(module: Module)
    }

    class ServiceContainer {
      -services: Map~string, any~
      -globalMiddleware: GlobalMiddleware[]
      +register(service: Service)
      +get(name: string)
      +use(middleware: GlobalMiddleware)
      +installPlugin(plugin: GlobalPlugin)
    }

    class SegmentedEventBus {
      -segments: Map~string, EventBusSegment~
      -subscribers: Map~string, Set~Subscriber~~
      +createSegment(name: string, config: EventBusConfig)
      +publish(event: Event)
      +subscribe(segmentName: string, subscriber: Subscriber)
    }

    class PluginManager {
      -plugins: Map~string, Plugin~
      -lifecycle: PluginLifecycle
      +installGlobal(plugin: GlobalPlugin)
      +installService(name: string, plugin: ServicePlugin)
      +resolveConflicts(metadata: PluginMetadata)
    }

    class Logger {
      -eventBus: SegmentedEventBus
      -collectors: LogCollector[]
      +log(level: LogLevel, message: string, data?: any)
      +addCollector(collector: LogCollector)
      +enableDebugMode()
    }
  }

  namespace StateManagement {
    class StateStore {
      -storage: StateStorage
      -eventBus: SegmentedEventBus
      -middleware: StoreMiddleware[]
      +get(key: string): any
      +set(key: string, value: any)
      +select(selector): Observable
    }

    class StateStorage {
      -adapter: StorageAdapter
      -type: StorageType
      -strategy: CacheStrategy
      +read(key: string)
      +write(key: string, value: any)
    }

    class StorageAdapter {
      <<interface>>
      +read(key: string)
      +write(key: string, value: any)
      +clear()
    }

    class CacheStrategy {
      <<interface>>
      +isValid(entry: CacheEntry)
      +shouldRevalidate(entry: CacheEntry)
    }
  }

  namespace Query {

    class QueryApi {
      -name: string
      -config: QueryConfig
      +createEndpoint(config: EndpointConfig): QueryEndpoint
    }

    class QueryEndpoint {
      -config: EndpointConfig
      +execute(params: any): Promise
      +on(event: string, handler: Function): void
      +off(event: string, handler: Function): void
    }
    
    class QueryManager {
      -store: StateStore
      -eventBus: SegmentedEventBus
      -middleware: QueryMiddleware[]
      -effectsManager: EffectsManager
      -retryManager: RetryPolicyManager
      +createQuery(config: QueryConfig)
      +createApi(name: string, config: QueryConfig): QueryApi
      +execute(query: Query)
      +use(middleware: QueryMiddleware)
    }

    class QueryConfig {
      -rootConfig: RootConfig
      -groupConfig: GroupConfig
      -endpointConfig: EndpointConfig
    }
    
    class QueryBuilder {
      +setMethod(method: string)
      +setURL(url: string)
      +setData(data: any)
      +setRetryPolicy(policy: RetryPolicy)
      +build(): Query
    }

    class QueryExecutor {
      -store: StateStore
      -middleware: QueryMiddleware[]
      -retryManager: RetryPolicyManager
      +execute(query: Query)
      +cancel(queryId: string)
    }

    class RetryPolicyManager {
      -policies: Map~string, RetryPolicy~
      +addPolicy(name: string, policy: RetryPolicy)
      +getPolicy(name: string)
      +executeWithRetry(fn: Function, policy: RetryPolicy)
    }

    class BaseEffectBuilder~T~ {
      #source$: Observable~T~
      +withLatestFrom(observable: Observable): BaseEffectBuilder
      +switchMap(project: Function): Observable
      +addOptions(configFn: Function): BaseEffectBuilder
    }

    class QueryEffectBuilder~T~ {
      #source$: Observable~T~
      -queries: Query[]
      +ofTypeSuccess(options: QueryEffectOptions): QueryEffectBuilder
      +ofTypeError(options: QueryEffectOptions): QueryEffectBuilder
    }

    class SelectorEffectBuilder~T~ {
      #source$: Observable~T~
      -selectors: Selector[]
      +ofTypeValues(options?: QueryEffectOptions): SelectorEffectBuilder
    }

    class EffectsManager {
      -store: StateStore
      -eventBus: SegmentedEventBus
      -effectMiddleware: EffectMiddleware
      +watchQueryEffects(queries: Query[]): QueryEffectBuilder
      +watchSelectorEffects(selectors: Selector[]): SelectorEffectBuilder
      +combine(...effects: Effect[]): Effect
    }

    class EffectMiddleware {
      -dependencies: EffectDependencies
      +run(effect: Effect): void
      +combine(...effects: Effect[]): Effect
    }
  }

  namespace Worker {
    class WorkerManager {
      -store: StateStore
      -eventBus: SegmentedEventBus
      -strategyManager: WorkerStrategyManager
      -messageBroker: MessageBroker
      +register(worker: Worker)
      +broadcast(message: any)
    }

    class WorkerStrategyManager {
      -strategies: WorkerStrategy[]
      +addStrategy(strategy: WorkerStrategy)
      +getAvailableStrategy()
      +executeWithStrategy(task: Task)
    }

    class MessageBroker {
      -workers: Set~WorkerAdapter~
      +addWorker(worker: WorkerAdapter)
      +removeWorker(worker: WorkerAdapter)
      +broadcast(message: any)
    }

    class SyncManager {
      -store: StateStore
      -eventBus: SegmentedEventBus
      +sync()
      +getSyncState()
    }
  }

%% Inheritance Relationships
  QueryEffectBuilder --|> BaseEffectBuilder
  SelectorEffectBuilder --|> BaseEffectBuilder

%% Component Relationships
  QueryManager --> EffectsManager
  EffectsManager --> QueryEffectBuilder
  EffectsManager --> SelectorEffectBuilder
  EffectsManager --> EffectMiddleware
  QueryManager --> QueryApi
  QueryApi --> QueryEndpoint
  
%% Core Relationships
  ServiceContainer --> ModuleInitializer
  ServiceContainer --> SegmentedEventBus
  ServiceContainer --> PluginManager
  ServiceContainer --> Logger

%% State Management Relationships
  StateStore --> StateStorage
  StateStore --> SegmentedEventBus
  StateStore --> CacheStrategy
  StateStorage --> StorageAdapter

%% Query Relationships
  QueryManager --> StateStore
  QueryManager --> SegmentedEventBus
  QueryManager --> QueryExecutor
  QueryManager --> RetryPolicyManager
  QueryExecutor --> StateStore
  QueryExecutor --> RetryPolicyManager

%% Worker Relationships
  WorkerManager --> StateStore
  WorkerManager --> SegmentedEventBus
  WorkerManager --> MessageBroker
  WorkerManager --> SyncManager
  WorkerManager --> WorkerStrategyManager
  WorkerManager --> PluginManager
```



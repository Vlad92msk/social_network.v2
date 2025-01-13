# Расширенное руководство по Mermaid

## 1. Диаграмма классов (Class Diagram)

### Базовый пример
```mermaid
classDiagram
   class Animal {
      +String name
      +int age
      +makeSound() void
      +move() void
   }
   class Dog {
      -String breed
      +bark() void
      +wagTail() void
   }
   class Cat {
      -int lives
      +meow() void
      +scratch() void
   }
   Animal <|-- Dog
   Animal <|-- Cat
```

### Продвинутый пример с разными типами связей
```mermaid
classDiagram
   direction TB
%% Абстрактные классы и интерфейсы
   class IEventEmitter {
      <<interface>>
      +subscribe(eventName: string, handler: Function)* void
      +unsubscribe(eventName: string, handler: Function)* void
      +emit(eventName: string, data: any)* void
   }

   class BaseService {
      <<abstract>>
      #logger: Logger "Сервис логирования"
      #config: Config "Конфигурация"
      +initialize()* void
      #validateConfig()* boolean
      #logError(error: Error) void
   }

%% Конкретные реализации
   class EventBus {
      -handlers: Map~string, Function[]~
      +subscribe(eventName: string, handler: Function) void
      +unsubscribe(eventName: string, handler: Function) void
      +emit(eventName: string, data: any) void
      -validateHandler(handler: Function) boolean
   }

   class StoreService {
      -state: State
      -eventBus: EventBus
      +getState() State
      +setState(newState: State) void
      +select(selector: Function) any
      -notifySubscribers(newState: State) void
   }

   class UserService {
      -store: StoreService
      -api: ApiService
      +getCurrentUser() User
      +updateUser(userData: UserData) Promise~User~
      +subscribeToUserChanges(handler: Function) void
      -validateUserData(userData: UserData) boolean
   }

   class NotificationService {
      -eventBus: EventBus
      -store: StoreService
      +initialize() void
      +showNotification(message: string) void
      -handleUserUpdate(userData: UserData) void
   }

%% Вспомогательные классы
   class Logger {
      +info(message: string) void
      +error(error: Error) void
      +warn(message: string) void
      -formatMessage(message: string) string
   }

   class ApiService {
      -baseUrl: string
      -headers: Headers
      +get(url: string) Promise
      +post(url: string, data: any) Promise
      -handleError(error: Error) void
   }

%% Отношения и связи
   IEventEmitter <|.. EventBus
   BaseService <|-- StoreService
   BaseService <|-- UserService
   BaseService <|-- NotificationService

   StoreService *-- EventBus
   UserService o-- StoreService
   UserService o-- ApiService
   NotificationService o-- EventBus
   NotificationService o-- StoreService
   BaseService o-- Logger

%% Примечания
   note for EventBus "Реализация паттерна Observer"
   note for StoreService "Управление состоянием приложения"
   note for UserService "Бизнес-логика пользователя"
   note for NotificationService "Управление уведомлениями"
```


```mermaid
classDiagram
    direction LR
    
    namespace Infrastructure {
        class Logger {
            +log(message) void
        }
        class Config {
            +get(key) value
        }
    }

    namespace Core {
        class BaseService {
            <<abstract>>
            #initialize() void
        }
        class EventBus {
            +emit(event) void
        }
    }

    namespace Features {
        class UserService {
            +getUser() User
        }
        class AuthService {
            +login() void
        }
    }

    %% Наследование
    BaseService <|-- UserService
    BaseService <|-- AuthService

    %% Композиция
    BaseService *-- Logger
    BaseService *-- Config

    %% Зависимости
    UserService ..> EventBus
    AuthService ..> EventBus

    %% Агрегация
    EventBus o-- Logger
```


Основные способы управления расположением в Mermaid:

1. **Направление диаграммы**:
- TB: top to bottom (сверху вниз)
- BT: bottom to top (снизу вверх)
- LR: left to right (слева направо)
- RL: right to left (справа налево)


2. **Типы связей** влияют на расположение:
- `-->` стандартная связь
- `-.->` пунктирная линия
- `==>` жирная линия
- `--o` агрегация
- `--*` композиция
- `--|>` наследование
- `..|>` реализация интерфейса

3. **Управление отступами и пробелами**:
- Используйте пустые строки между секциями
- Выравнивайте связанные классы
- Группируйте связанные элементы вместе

4. **Оптимизация связей**:
- Старайтесь минимизировать пересечения линий
- Размещайте связанные классы ближе друг к другу
- Используйте иерархическую структуру

Давайте создам ещё один пример, который комбинирует разные подходы к управлению расположением:

Некоторые советы по оптимизации расположения:

1. **Иерархическое расположение**:
   - Размещайте базовые классы/интерфейсы сверху или слева
   - Расположите наследников ниже или справа

2. **Группировка по функциональности**:
   - Используйте namespaces или subgraphs для логически связанных классов
   - Сохраняйте связанные сервисы рядом

3. **Минимизация пересечений**:
   - Старайтесь располагать классы так, чтобы минимизировать пересечение линий
   - Используйте разные типы связей для лучшей читаемости

4. **Баланс и симметрия**:
   - Старайтесь равномерно распределять классы
   - Соблюдайте визуальный баланс в диаграмме


## 2. Блок-схема (Flowchart)

### Простой пример процесса
```mermaid
flowchart TD
   A[Начало] --> B{Есть ли данные?}
   B -->|Да| C[Обработка данных]
   B -->|Нет| D[Загрузка данных]
   C --> E[Сохранение результата]
   D --> B
   E --> F([Конец])
```

### Сложный пример с разными формами и подграфами
```mermaid
flowchart TB
   subgraph Подготовка
      A([Старт]) --> B[/Ввод данных/]
      B --> C{{Валидация}}
   end

   subgraph Обработка
      C -->|Валидно| D[Процесс 1]
      C -->|Ошибка| E[Исправление]
      D --> F[\Результат/]
      E --> B
   end

   subgraph Завершение
      F --> G>Вывод]
      G --> H[(База данных)]
   end
```

## 3. Диаграмма последовательности (Sequence Diagram)

### Пример взаимодействия с сервером
```mermaid
sequenceDiagram
   actor User
   participant Client
   participant Server
   participant DB

   User->>+Client: Отправить форму
   activate Client
   Client->>+Server: POST /api/data
   Server->>+DB: Сохранить данные

   alt Успешно
      DB-->>-Server: Данные сохранены
      Server-->>-Client: 200 OK
      Client-->>-User: Показать успех
   else Ошибка
      DB-->>-Server: Ошибка
      Server-->>-Client: 500 Error
      Client-->>-User: Показать ошибку
   end

   note right of Server: Обработка может занять время
```

### Пример с параллельным выполнением
```mermaid
sequenceDiagram
   participant A as Сервис A
   participant B as Сервис B
   participant C as Сервис C

   par Параллельные запросы
      A->>B: Запрос 1
      A->>C: Запрос 2
   end

   B-->>A: Ответ 1
   C-->>A: Ответ 2

   rect rgb(200, 150, 255)
      note right of A: Обработка результатов
      A->A: Объединение данных
   end
```

## 4. Диаграмма состояний (State Diagram)

### Пример жизненного цикла заказа
```mermaid
stateDiagram-v2
   [*] --> Created

   state Created {
      [*] --> WaitingPayment
      WaitingPayment --> Paid: payment received
      WaitingPayment --> Cancelled: timeout
   }

   state Paid {
      [*] --> Processing
      Processing --> Packed: assembly completed
      Packed --> Shipped: sent to delivery
   }

   Shipped --> Delivered: received by client
   Cancelled --> [*]
   Delivered --> [*]

   note right of Paid: Processing time depends on product availability in warehouse

```

## 5. ER-диаграмма (Entity Relationship Diagram)

### Пример базы данных интернет-магазина
```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string id PK
        string name
        string email
        string address
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        string id PK
        string customer_id FK
        date created_at
        decimal total_amount
    }
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT {
        string id PK
        string name
        decimal price
        int stock_quantity
    }
    ORDER_ITEM {
        string order_id FK
        string product_id FK
        int quantity
        decimal price
    }
```

## 6. Gantt-диаграмма (добавлено)

### Пример планирования проекта
```mermaid
gantt
    title Планирование проекта
    dateFormat  YYYY-MM-DD
    
    section Планирование
    Анализ требований     :a1, 2024-01-01, 7d
    Проектирование        :a2, after a1, 10d
    
    section Разработка
    Разработка Frontend   :after a2, 15d
    Разработка Backend    :after a2, 20d
    
    section Тестирование
    Unit Tests           :after a2, 12d
    Integration Tests    :after a2, 8d
```

## 7. Круговая диаграмма (добавлено)

### Пример распределения бюджета
```mermaid
pie
    title Распределение бюджета проекта
    "Разработка" : 45
    "Тестирование" : 30
    "Документация" : 15
    "Управление" : 10
```

## Дополнительные советы

1. **Стилизация**
   - Можно использовать различные цвета для узлов и связей
   - Поддерживаются HTML-цвета и RGB/RGBA
   - Можно настраивать толщину линий и стиль границ

2. **Интерактивность**
   - Многие диаграммы поддерживают кликабельные элементы
   - Можно добавлять ссылки на элементы
   - Поддерживаются всплывающие подсказки

3. **Масштабирование**
   - Диаграммы автоматически масштабируются
   - Можно указывать направление и размер диаграммы

4. **Импорт/Экспорт**
   - Диаграммы можно экспортировать в SVG или PNG
   - Код диаграммы можно сохранять в markdown-файлах
   - Поддерживается встраивание в различные платформы

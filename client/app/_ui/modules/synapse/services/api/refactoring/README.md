# API Module Refactoring

Это рефакторинг модуля API для повышения качества кода и удобства использования. Реализация обеспечивает корректную работу существующего интерфейса использования API, одновременно улучшая внутреннюю структуру.

## Основные улучшения

1. **Улучшенное разделение ответственности**:
   - Выделены четкие компоненты с единственной зоной ответственности
   - Создана явная иерархия классов с четкими ролями

2. **Централизованное управление кэшем**:
   - Логика кэширования вынесена в отдельный класс `CacheManager`
   - Единый механизм формирования ключей кэша

3. **Улучшенное управление заголовками и параметрами кэширования**:
   - Централизованное объединение cacheableHeaderKeys с разных уровней
   - Явная передача параметров кэширования между компонентами

4. **Система событий и middleware**:
   - Переработанная система событий с типизацией
   - Усовершенствованная система middleware с приоритетами

5. **Типизация и документация**:
   - Улучшенная типизация с использованием TypeScript generics
   - Подробное документирование всех классов и методов

## Структура

### Основные компоненты:

- **ApiModule** - базовый модуль для работы с API
- **ApiClient** - расширенный типизированный клиент API
- **Endpoint** - представление отдельного эндпоинта API
- **CacheManager** - централизованное управление кэшем
- **RequestExecutor** - исполнитель запросов
- **EventBus** - система событий
- **MiddlewareManager** - менеджер middleware
- **EndpointStateManager** - управление состоянием эндпоинтов
- **StorageManager** - абстракция над хранилищем

### Middleware:

- **LoggerMiddleware** - логирование запросов и ответов
- **AuthMiddleware** - добавление авторизации в запросы
- **RetryMiddleware** - повторные попытки при ошибках
- **ErrorHandlerMiddleware** - обработка ошибок
- **CacheControlMiddleware** - управление кэшированием

## Использование

Интерфейс использования остается прежним:

```typescript
export const api = new ApiClient({
  cacheableHeaderKeys: ['X-Global-Header'],
  storageType: 'indexedDB',
  options: {
    name: 'api-storage',
    dbName: 'api-cache',
    storeName: 'requests',
    dbVersion: 1,
  },
  cache: true,
  baseQuery: {
    baseUrl: 'https://api.example.com',
    timeout: 10000,
    cacheableHeaderKeys: ['X-Global-Header'],
    prepareHeaders: async (headers, context) => {
      headers.set('X-Global-Header', 'value');
      return headers;
    },
  },
  endpoints: async (create) => ({
    getDataById: create<number, DataType>({
      cacheableHeaderKeys: ['X-Custom-Header'],
      request: (id) => ({
        path: `/data/${id}`,
        method: 'GET',
      }),
      cache: true,
      tags: ['data'],
    }),
  }),
});

// Добавление middleware
api.use(createLoggerMiddleware({ logLevel: 'info' }));
api.use(createAuthMiddleware(() => localStorage.getItem('token') || ''));

// Использование API
const data = await api.request('getDataById', 123);
```

## Дополнительные возможности

- Асинхронное формирование заголовков на разных уровнях
- Асинхронное формирование endpoints
- Управление ключами заголовков для кэширования на разных уровнях
- Гибкая настройка опций кэширования
- Расширенная система событий и middleware
# QueryModule

QueryModule - это универсальный модуль для управления API-запросами с поддержкой кэширования, отслеживания состояния и типизации.

## Концепция

QueryModule предоставляет унифицированный способ работы с API, который:
1. Централизует настройки запросов
2. Интегрируется с системой кэширования
3. Отслеживает состояние запросов
4. Предоставляет гибкий API для использования в различных контекстах

## Инициализация

```typescript
const api = new QueryModule({
  // Тип хранилища для кэширования и состояния
  storageType: 'indexedDB', // 'memory' | 'localStorage' | 'indexedDB'
  
  // Настройки хранилища
  options: {
    dbName: 'api-cache',
    storeName: 'requests',
    dbVersion: 1
  },
  
  // Настройки кэширования
  cache: {
    ttl: 1000 * 60 * 30, // Время жизни кэша (30 минут)
    cleanup: {
      enabled: true,
      interval: 1000 * 60 * 60, // Интервал очистки (1 час)
    },
    invalidateOnError: true, // Инвалидация кэша при ошибках
  },
  
  // Базовые настройки для всех запросов
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.example.com',
    prepareHeaders: (headers, { getToken }) => {
      const token = getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  
  // Описание эндпоинтов
  endpoints: () => ({
    getUsers: {
      request: (params?: { page?: number, limit?: number }) => ({
        path: '/users',
        method: 'GET',
        query: params
      }),
      cache: { ttl: 1000 * 60 * 5 }, // 5 минут
      tags: ['users']
    },
    
    getUserById: {
      request: (id: number) => ({
        path: `/users/${id}`,
        method: 'GET'
      }),
      cache: { ttl: 1000 * 60 * 10 }, // 10 минут
      tags: ['user']
    },
    
    updateUser: {
      request: (data: { id: number, name: string, email: string }) => ({
        path: `/users/${data.id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['user', 'users']
    }
  })
})
```

## Интерфейсы

### Endpoint

```typescript
interface Endpoint<TParams, TResult> {
  // Выполнение запроса
  fetch: (params: TParams, options?: RequestOptions) => Promise<TResult>
  
  // Отслеживание состояния
  subscribe: (callback: (state: EndpointState<TResult>) => void) => Unsubscribe
  getState: () => EndpointState<TResult>
  
  // Управление кэшем
  invalidate: () => void
  reset: () => void
  
  // Отмена запроса
  abort: () => void
  
  // Метаданные
  meta: {
    name: string
    tags: string[]
    invalidatesTags: string[]
    cache: CacheConfig
  }
}
```

### EndpointState

```typescript
interface EndpointState<TData> {
  status: 'idle' | 'loading' | 'success' | 'error'
  data?: TData
  error?: Error
  meta: {
    tags: string[]
    invalidatesTags: string[]
    cache: CacheConfig
  }
}
```

### RequestOptions

```typescript
interface RequestOptions {
  disableCache?: boolean
  signal?: AbortSignal
  timeout?: number
  headers?: Record<string, string>
}
```

### EndpointConfig

```typescript
interface EndpointConfig<TParams, TResult> {
  request: (params: TParams) => RequestDefinition
  cache?: CacheConfig
  tags?: string[]
  invalidatesTags?: string[]
}
```

### RequestDefinition

```typescript
interface RequestDefinition {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  query?: Record<string, any>
  headers?: Record<string, string>
}
```

## Использование

### Выполнение запросов

```typescript
// Простой вызов
const users = await api.getUsers.fetch({ page: 1, limit: 10 })

// С дополнительными опциями
const user = await api.getUserById.fetch(123, { 
  disableCache: true, // Пропустить кэш для этого запроса
  timeout: 5000      // Таймаут 5 секунд
})

// Запрос с возможностью отмены
const controller = new AbortController()
api.getUsers.fetch({ page: 1 }, { signal: controller.signal })
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Запрос был отменен')
    }
  })

// Отмена через 2 секунды
setTimeout(() => controller.abort(), 2000)
```

### Работа с состоянием

```typescript
// Получение текущего состояния
const state = api.getUsers.getState()
console.log('Статус:', state.status)
console.log('Данные:', state.data)

// Подписка на изменения состояния
const unsubscribe = api.getUsers.subscribe((state) => {
  console.log('Новое состояние:', state)
})

// Отписка
unsubscribe()
```

### Управление кэшем

```typescript
// Инвалидация кэша для конкретного эндпоинта
api.getUsers.invalidate()

// Сброс состояния эндпоинта
api.getUsers.reset()
```

## Интеграция с React

```typescript
// Хук для использования эндпоинта
function useQuery<TParams, TResult>(
  endpoint: Endpoint<TParams, TResult>,
  params: TParams,
  options?: RequestOptions
) {
  const [state, setState] = useState<EndpointState<TResult>>()
  
  useEffect(() => {
    // Получаем текущее состояние
    setState(endpoint.getState())
    
    // Подписываемся на изменения
    const unsubscribe = endpoint.subscribe(setState)
    
    // Выполняем запрос
    endpoint.fetch(params, options)
    
    return unsubscribe
  }, [endpoint, params, options])
  
  return state
}

// Использование в компоненте
function UsersList() {
  const usersState = useQuery(api.getUsers, { page: 1, limit: 10 })
  
  if (usersState.status === 'loading') {
    return <div>Загрузка...</div>
  }
  
  if (usersState.status === 'error') {
    return <div>Ошибка: {usersState.error.message}</div>
  }
  
  return (
    <ul>
      {usersState.data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## Интеграция с RxJS

```typescript
import { from, Observable } from 'rxjs'
import { switchMap, filter, map } from 'rxjs/operators'

// Создание Observable из запроса
const users$ = from(api.getUsers.fetch({ page: 1 }))

// Создание Observable из состояния
const usersState$ = new Observable(subscriber => {
  return api.getUsers.subscribe((state) => {
    subscriber.next(state)
  })
})

// Использование в потоке
usersState$.pipe(
  filter(state => state.status === 'success'),
  map(state => state.data),
  switchMap(users => processUsers(users))
).subscribe(result => {
  console.log('Обработанный результат:', result)
})
```

## Преимущества

1. **Универсальность** - работает в разных контекстах (React, RxJS, vanilla JS)
2. **Централизация** - все запросы настраиваются в одном месте
3. **Кэширование** - встроенная система кэширования с гибкой настройкой
4. **Типизация** - полная поддержка TypeScript
5. **Независимость** - не привязан к конкретным фреймворкам

## Ключевые отличия от RTK Query

1. Фокус на управлении запросами, а не на управлении состоянием
2. Нет искусственного разделения на query и mutations
3. Более чистая интеграция с существующей системой хранилища
4. Больший контроль над процессом кэширования
5. Универсальное API, которое можно использовать в разных контекстах

## Техническая реализация

QueryModule интегрируется с существующей архитектурой хранилища:
1. Использует IndexedDBStorage/LocalStorage/MemoryStorage для кэширования
2. Переиспользует механизмы CacheUtils для управления кэшем
3. Поддерживает типизированные запросы и ответы
4. Предоставляет механизмы подписки на изменения состояния

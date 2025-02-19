# Предполагаемое использование

## Инициализация

```typescript
// Пользовательские middleware для разных сервисов
// Не уверен что именно так должны быть реализованы - это просто предположение
const stateLogger: StateMiddleware = (context) => (next) => next({
  beforeSet: (key: string, newValue: any, oldValue: any) => {
    console.log('current-state', context.state)
    console.log('Before set:', {
      key,
      newValue,
      oldValue
    });
    return newValue;
  },
  afterSet: (key: string, value: any) => {
    console.log('After set:', {
      key,
      value
    });
  }
});
const stateValidator: StateMiddleware = (context) => (next) => next({
  beforeSet: (key: string, value: any) => {
    if (key.startsWith('auth.') && !value) {
      throw new Error('Auth values cannot be null');
    }
    return value;
  }
});

const authMiddleware: QueryMiddleware = (context) => (next) => next({
  beforeExecute: (query) => {
    const token = context.state.get('auth.token');
    return {
      ...query,
      headers: {
        ...query.headers,
        Authorization: `Bearer ${token}`
      }
    };
  },
  afterExecute: (response, query) => {
    if (response.status === 401) {
      container.events.emit('auth:expired');
    }
    return response;
  }
});
const cacheMiddleware: QueryMiddleware = (context) => (next) => next({
  beforeExecute: async (query) => {
    const cached = await context.state.get(`query:${query.key}`);
    if (cached && !query.force) {
      return {
        ...query,
        skipExecution: true,
        result: cached
      };
    }
    return query;
  },
  afterExecute: async (response, query) => {
    if (response.status === 200) {
      await context.state.set(`query:${query.key}`, response.data);
    }
    return response;
  }
});
const queryMiddleware: QueryMiddleware;
const workerMonitor: WorkerMiddleware = (context) => (next) => next({
  beforeMessage: (message, workerName) => {
    return {
      ...message,
      __meta: {
        timestamp: Date.now(),
        worker: workerName
      }
    };
  },
  afterMessage: (message, workerName) => {
    const duration = Date.now() - message.__meta.timestamp;
    container.logger.log('Worker execution time:', {
      worker: workerName,
      duration,
      type: message.type
    });
    return message;
  }
});

// Пользовательские плагны для разных сервисов
// тоже должны иметь единый интерфейс чтобы пользователь понимал как их создавать и что у него для этого есть
// либо должы быть extend или implements (я пока не понимаю)
class CustomStoragePlugin {
  install(context) {
    // Регистрация нового типа хранилища
    context.state.registerStorage('custom', {
      async get(key: string) {
        // Реализация
        return value;
      },
      async set(key: string, value: any) {
        // Реализация
        return true;
      },
      async remove(key: string) {
        // Реализация
        return true;
      },
      async clear() {
        // Реализация
        return true;
      }
    });

    // Расширение API хранилища
    context.state.extend({
      async backup() {
        const state = await context.state.getAll();
        // Реализация бэкапа
        return backupId;
      },
      async restore(backupId: string) {
        // Реализация восстановления
        return true;
      }
    });
  }
}

class SyncPlugin {
  install(container) {
    // Регистрация домена событий
    container.events.registerDomain('sync', {
      started: 'sync:started',
      completed: 'sync:completed',
      failed: 'sync:failed',
      progress: 'sync:progress'
    });

    // Расширение API контейнера
    container.extend({
      async sync() {
        container.events.emit('sync:started');

        try {
          const state = await container.state.getAll();
          let processed = 0;
          const total = Object.keys(state).length;

          for (const [key, value] of Object.entries(state)) {
            await this.syncItem(key, value);
            processed++;
            container.events.emit('sync:progress', {
              processed,
              total
            });
          }

          container.events.emit('sync:completed');
        } catch (error) {
          container.events.emit('sync:failed', error);
          throw error;
        }
      },

      async syncItem(key: string, value: any) {
        // Реализация синхронизации отдельного элемента
      }
    });
  }
}


// Использование:
const someEffect = (store$, { todosApi }, utils) =>
  // подписываемся на однин/несколькими методов
  watchQueryEffects([createTodo]).pipe(
    // Следим за успешним результатом
    // every: true - каждый метод должен быть success
    // every: false - хотя бы 1  метод должен быть success
    ofTypeSuccess({ every: true }),
    // Берем данные из хранилища
    withLatestFrom(
      store$.pipe(
        map(store => AuthSelectors.selectProfileInfoApiDataItemId(store))
      )
    ),
    addOptions(([[queryData], [storeData]]) => ({
      validate: () => [queryData.someProps > 0],
      poolingInterval: 5000
    })),
    // делаем запрос и обрабатываем его если нужно
    switchMap(() => todosApi.getTodos.execute({ ids: ['1', '2'] })); 
  )

const someEffect1 = (store$, { todosApi }, utils) =>
  // подписываемся на одно/несколько значений в хранилище
  watchSelectorEffects([selector(state => state.filter)]).pipe(
    // Следим за изменениями одного/всех значений
    // every: true - измениться должны все значения
    // every: false - измениться должно хотя бы одно значение
    ofTypeValues({ every: false }),
    withLatestFrom(
      store$.pipe(
        map(store => AuthSelectors.someSelector(store))
      )
    ),
    switchMap(([[filterValue], [someSelectorValue]]) => {
      if (filterValue === 'all') return todosApi.getTodos.execute();
      return todosApi.getTodos.execute({ ids: ['1', '2'] });
    })
  )

const initialState = {
  todos: [],
  filter: 'all',
  auth: {
    token: null,
    user: null
  }
}

// Лучше использовать builder pattern
const synapse = new SynapseBuilder()
  .withStorage({
    type: 'memory',
    initialState: {
      app: {
        version: '1.0.0',
        lastUpdate: Date.now(),
        features: {
          darkMode: true,
          beta: false
        }
      }
    },
    plugins: [validationPlugin, encryptionPlugin],
    middlewares: (getDefaultMiddleware) => [
      ...getDefaultMiddleware({
        segments: ['user', 'app'] // эти middleware будут применяться только к указанным сегментам
      }),
      createLoggerMiddleware({
        logLevel: 'debug',
        prefix: '[Storage] ',
        segments: ['user'] // логирование только для user сегмента
      }),
      createCacheMiddleware({
        ttl: 10000,
        maxSize: 1000,
        // segments не указаны - будет применяться ко всем сегментам
      }),
    ],
  })
  .withWorkers({
    broadcast: true, // Шаринг состояния на все вкладки
    // Добавляем пользовательские middlewares
    middlewares: ((getDefaultWorkersMiddleware) => getDefaultWorkersMiddleware().concat([workerMonitor]))
    //... другие настройки (пока я не знаю какие и как их организовать)
  })
  .withQuery({
    baseURL: 'https://api.example.com',
    credentials: 'include',
    cachePolicy: 'network-first',
    // Устанавливаем по умолчанию что быдет показано для различных состояний запроса
    defineComponents: {
      loading: <div>loading </div>,
      error: <div>error </div>, 
    },
    // Добавляем пользовательские middlewares
    middlewares: ((getDefaultWorkersMiddleware) => getDefaultWorkersMiddleware().concat([workerMonitor]))
    //... другие настройки (пока я не знаю какие и как их организовать)
  })
  // Регистрация эффектов
  .createEffects([someEffect, someEffect1])
  .build();

// Запуск
const cleanup = synapse.effects.run();


const appSegment = synapse.storage.createSegment<AppState>({
  name: 'app',
  type: 'indexDB',
  initialState: {
    version: '1.0.0',
    lastUpdate: Date.now(),
    features: {
      darkMode: true,
      beta: false
    }
  }
});


// Определение для группы запросов
const todosApi = synapse.query.createApi(
  // Предположу, что это можно использовать в качестве комопнента для создания ключа в хранилище под которым будет храниться результат
  // или же это может быть свойством объекта типа api: { todos: {'queryName': {'props': result}} }
  // в общем нужно подумать как эфективнее хранить кэшированные запросы
  'todos',
  {
    // Базовые настройки для всех запросов
    baseURL: '/api/todos',
    tagTypes: [],
    credentials: 'include',
    // для отслеживания конкретныой группы методов
    middleware: [],
    cache: {
      maxAge: 5000,
      staleWhileRevalidate: true
    },
    prepareHeaders: (headers, { getState }) => {
      const state = getState()
      const profileId = state.profile?.profile?.id
      const userInfoId = state.profile?.profile?.user_info?.id

      if (profileId) {
        headers.set(CookieType.USER_PROFILE_ID, String(profileId))
      }
      if (userInfoId) {
        headers.set(CookieType.USER_INFO_ID, String(userInfoId))
      }
      return headers
    },
  });

// Определение метода
const getTodos = todosApi.createEndpoint({
  name: 'getTodos',
  method: 'GET',
  query: (params) => ({
    path: `/?ids:${params.ids}`,
  }),
  // Дополнительные настройки кэширования
  cache: {
    key: 'todos-list',
    maxAge: 1000 * 60
  },
});

const createTodo = todosApi.createEndpoint({
  method: 'POST',
  query: (params) => ({
    path: 'save',
    body: params.body
  }),
  // Автоматическая инвалидация кэша после выполнения
  invalidates: ['todos-list']
});


// Таким образом у нас есть api которые мы создаем и которые можем вызывать как отдельно, так и в effects
// Результаты сохраняются по единному паттерну в централизованное хранилище


// Экспортируем для использования в приложении
// например для ReactJS мы должны создать контекст и функции получения/изменения данных
export const {
  getState,
  setState,
  updateState,
  subscribe
} = synapse.state.methods

export const {
  shutdown, // Отключение системы
  plugins: { deactivateAll }, // Деактивация плагинов 
  worker: { stopAll }, // Остановка workers
} = synapse
```



### State Management

```typescript
// Получение значений
const todos = await synapse.state.methods.getState('todos');
const user = await synapse.state.get('auth.user');

// Установка значений
await synapse.state.methods.setSate('todos', [...todos, newTodo]);
await synapse.state.methods.setSate('auth.token', token);

// Обновление с помощью функции
await synapse.state.methods.updateState('todos', todos => todos.filter(todo => !todo.completed));

// Подписка на изменения
const unsubscribe = synapse.state.methods.subscribe('todos', todos => {
  console.log('Todos updated:', todos);
});

// Подписка с селектором
const unsubscribeActive = synapse.state.methods.subscribe(
  state => state.todos.filter(todo => !todo.completed),
  activeTodos => {
    console.log('Active todos:', activeTodos);
  }
);

// Отписка
unsubscribe();
unsubscribeActive();
```

### Query Management

```typescript

// Вызов запроса - вызовится если все условия выполнились
// Результат централизовано сохранится в состоянии
// если в другом месте приложения этот же метод будет вызыван с теми же параметрами - данные будут взяты из хранилища и состояние обновится
const result = await getTodos.execute({
  payload: {...},
  options: {
    validate: (payload, state) => true,
    poolingInterval: 5000,
    // Убираю компоненты по умолчанию если не хочу их отображать  
    defineComponents: false
  }
});

const newTodo = await createTodo.execute({
  data: {
    title: 'New Todo',
    completed: false
  }
});

<div>
  // если метод success - то отображается значени
  // если loading - отображается то, что определено в еdefineComponents
  // таким образом не нужно каждый раз указывать что отображать
  {result}
</div>


// Ручная инвалидация кэша
container.query.invalidate('todos-list');

// Подписка на состояние запроса
const unsubscribe = getTodos.subscribe((state) => {
  console.log('Query state:', state);
});
```








### Worker Management

```typescript
// Регистрация воркера
const computationWorker = container.worker.register('computation', {
  file: '/workers/computation.js',
  shared: true,
  // Автоматическая переподписка при переподключении
  autoReconnect: true
});

// Отправка сообщения
const result = await computationWorker.send({
  type: 'HEAVY_CALCULATION',
  payload: { data: [] }
});

// Подписка на сообщения
const unsubscribe = computationWorker.onMessage(message => {
  console.log('Worker response:', message);
});

// Широковещательная отправка
container.worker.broadcast({
  type: 'SYSTEM_UPDATE',
  payload: { version: '1.0.0' }
});

// Подписка на все сообщения
container.worker.onAnyMessage((message, workerName) => {
  console.log(`Message from ${workerName}:`, message);
});
```



### Worker Pools

```typescript
// Создание пула воркеров
const pool = container.worker.createPool('computation', {
  size: 4,
  strategy: 'round-robin'
});

// Распределение задач
const results = await Promise.all(
  tasks.map(task => pool.execute(task))
);
```

### Plugin Development

```typescript
class AdvancedPlugin {
  install(container) {
    // Расширение нескольких модулей
    container.state.extend({
      // Методы для state
    });

    container.query.extend({
      // Методы для api
    });

    container.worker.extend({
      // Методы для worker
    });

    // Добавление глобальных методов
    container.extend({
      // Глобальные методы
    });

    // Регистрация middleware
    container.state.use({
      // State middleware
    });

    container.query.use({
      // Query middleware
    });

    // Регистрация событий
    container.events.registerDomain('plugin', {
      // События плагина
    });
  }
}
```

# API-модуль для управления запросами

Модуль предоставляет гибкую и типобезопасную систему выполнения HTTP-запросов с поддержкой кэширования, управления состоянием, работы с файлами и интеграцией с React.

## Основные возможности

- ⚡ **Типизированные запросы** с полной поддержкой TypeScript
- 🗄️ **Интеллектуальное кэширование** с возможностью инвалидации по тегам  
- 🔄 **Управление состоянием** с подпиской на изменения
- 📂 **Работа с файлами** - скачивание, предпросмотр, обработка
- 🔌 **React-хуки** для удобного использования в компонентах
- 🛡️ **Отказоустойчивость** с защитой от сетевых сбоев и таймаутов
- 🧩 **Модульная архитектура** с четким разделением ответственности

## Быстрый старт

### 1. Создание API-клиента

```typescript
import { ApiClient, ResponseFormat } from '@/app/_ui/modules/synapse/services/storage/modules/api';

// Создание API-клиента для внешних запросов
const api = new ApiClient({
  // Тип хранилища для кэша (indexedDB, localStorage, memory)
  storageType: 'indexedDB',
  
  // Настройки хранилища
  options: {
    name: 'api-storage',
    dbName: 'api-cache',
    dbVersion: 1
  },
  
  // Настройки кэширования
  cache: {
    ttl: 10 * 60 * 1000, // 10 минут
    cleanup: {
      enabled: true,
      interval: 24 * 60 * 60 * 1000 // Очистка раз в день
    },
    invalidateOnError: true
  },
  
  // Настройки базового запроса
  baseQuery: {
    baseUrl: 'https://api.example.com/v1',
    timeout: 10000, // 10 секунд
    prepareHeaders: (headers, context) => {
      // Получаем токен из localStorage
      const token = context.getFromStorage('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Устанавливаем подсистему
      headers.set('X-MES-SUBSYSTEM', 'MES');
      
      return headers;
    }
  },
  
  // Определение эндпоинтов
  endpoints: (builder) => ({
    // Получение данных пользователя
    getUser: builder.create({
      request: (id: number) => ({
        path: `/users/${id}`,
        method: 'GET'
      }),
      cache: { ttl: 30 * 60 * 1000 }, // 30 минут
      tags: ['user']
    }),
    
    // Обновление данных пользователя
    updateUser: builder.create({
      request: (data: { id: number, name: string, email: string }) => ({
        path: `/users/${data.id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['user', 'users-list']
    }),
    
    // Получение списка пользователей с пагинацией
    getUsers: builder.create({
      request: (params: { page?: number, limit?: number }) => ({
        path: '/users',
        method: 'GET',
        query: params
      }),
      cache: { ttl: 5 * 60 * 1000 }, // 5 минут
      tags: ['users-list']
    }),
    
    // Скачивание отчета в Excel
    downloadReport: builder.create({
      request: (params: { reportId: string, filters?: Record<string, any> }) => ({
        path: `/reports/${params.reportId}`,
        method: 'GET',
        query: params.filters,
        responseFormat: ResponseFormat.Blob, // Указываем формат ответа
        fileName: `report-${params.reportId}.xlsx` // Имя файла для скачивания
      }),
      cache: { ttl: 0 } // Не кэшируем файлы
    })
  })
});

// Экспорт типов для использования в компонентах
export type Api = typeof api;
export type ApiEndpoints = ReturnType<Api['getEndpoints']>;
```

### 2. Использование в JavaScript/TypeScript

```typescript
async function fetchUserData(userId: number) {
  try {
    // Получение эндпоинтов
    const endpoints = api.getEndpoints();
    
    // Получение данных пользователя
    const user = await endpoints.getUser.fetch(userId);
    console.log('User data:', user);
    
    // Получение списка пользователей
    const usersList = await endpoints.getUsers.fetch({ page: 1, limit: 20 });
    console.log('Users list:', usersList);
    
    // Скачивание отчета
    await endpoints.downloadReport.fetch({ 
      reportId: 'user-activity',
      filters: { userId, period: 'last-month' }
    });
    
    // Альтернативный способ скачивания файла
    await api.downloadFile(
      'downloadReport',
      { reportId: 'user-activity-detailed', filters: { userId } },
      `activity-report-${userId}.xlsx`
    );
  } catch (error) {
    console.error('API Error:', error);
  }
}
```

### 3. Использование в React-компонентах

```tsx
import React from 'react';
import { useQuery, useEndpoint, useFileDownload } from '@/app/_ui/modules/synapse/services/storage/modules/api/hooks';

// Компонент профиля пользователя 
function UserProfile({ userId }) {
  // useQuery автоматически выполняет запрос при монтировании
  const userState = useQuery(api.getEndpoints().getUser, userId);
  
  if (userState.status === 'loading') {
    return <div>Загрузка данных пользователя...</div>;
  }
  
  if (userState.status === 'error') {
    return <div>Ошибка: {userState.error?.message}</div>;
  }
  
  const user = userState.data;
  
  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <div>Email: {user.email}</div>
      <div>Role: {user.role}</div>
    </div>
  );
}

// Компонент для скачивания отчетов
function ReportDownloadButton({ reportId, reportName }) {
  // Используем хук для скачивания файлов
  const { 
    state, 
    download, 
    reset 
  } = useFileDownload(api.getEndpoints().downloadReport);
  
  const handleDownload = async () => {
    await download(
      { reportId, filters: { date: new Date().toISOString() } },
      `${reportName}.xlsx`
    );
  };
  
  return (
    <div>
      <button 
        onClick={handleDownload} 
        disabled={state.isLoading}
      >
        {state.isLoading ? 'Скачивание...' : 'Скачать отчет'}
      </button>
      
      {state.isError && (
        <div className="error">
          Ошибка: {state.error?.message}
          <button onClick={reset}>Попробовать снова</button>
        </div>
      )}
    </div>
  );
}

// Компонент формы редактирования пользователя
function UserEditForm({ userId }) {
  const [formData, setFormData] = React.useState({ name: '', email: '' });
  
  // useEndpoint для полного контроля над эндпоинтом
  const { 
    fetch: updateUser,
    isLoading,
    isSuccess,
    isError,
    error,
    reset
  } = useEndpoint(api.getEndpoints().updateUser);
  
  // Загрузка данных пользователя
  React.useEffect(() => {
    async function loadUser() {
      try {
        const user = await api.getEndpoints().getUser.fetch(userId);
        setFormData({
          name: user.name,
          email: user.email
        });
      } catch (err) {
        console.error('Failed to load user', err);
      }
    }
    
    loadUser();
  }, [userId]);
  
  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateUser({
        id: userId,
        ...formData
      });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Форма редактирования */}
      <div>
        <label>Name:</label>
        <input 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>
      
      <div>
        <label>Email:</label>
        <input 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Сохранение...' : 'Сохранить'}
      </button>
      
      {isSuccess && <div className="success">Данные успешно обновлены!</div>}
      {isError && <div className="error">Ошибка: {error?.message}</div>}
    </form>
  );
}
```

## Архитектура модуля

API-модуль состоит из следующих ключевых компонентов:

### ApiModule

Основной класс, отвечающий за:
- Инициализацию хранилища для кэша
- Создание и управление эндпоинтами
- Выполнение запросов
- Управление состоянием эндпоинтов

### ApiClient

Расширенная версия ApiModule с улучшенной типизацией, поддержкой билдер-паттерна и работой с файлами:
- Типизированные эндпоинты
- Методы для скачивания файлов
- Работа с разными форматами данных (Blob, ArrayBuffer, Text)

### ApiCache

Отвечает за кэширование результатов запросов:
- Хранение данных в выбранном хранилище (IndexedDB, LocalStorage, Memory)
- Инвалидация кэша по тегам
- Управление временем жизни кэша (TTL)
- Периодическая очистка устаревших записей

### Хуки для React

- **useQuery** - автоматически выполняет запрос при монтировании компонента
- **useEndpoint** - предоставляет полный контроль над эндпоинтом
- **useLazyQuery** - позволяет вручную запускать запрос
- **useFileDownload** - специализированный хук для скачивания файлов
- **useFilePreview** - хук для предпросмотра файлов
- **useApiClient** - получает доступ к API-клиенту через React Context

## Работа с файлами

Модуль предоставляет расширенные возможности для работы с файлами:

### 1. Скачивание файлов

```typescript
// Способ 1: Через определение эндпоинта
endpoints: (builder) => ({
  downloadReport: builder.create({
    request: (params) => ({
      path: `/reports/${params.id}`,
      method: 'GET',
      responseFormat: ResponseFormat.Blob,
      fileName: `report-${params.id}.xlsx`, // Автоматическое скачивание
    })
  })
})

// Способ 2: Через метод ApiClient
await api.downloadFile(
  'downloadReport',
  { id: '12345' },
  'custom-filename.xlsx'
);

// Способ 3: Получение файла как Blob без скачивания
const { data, metadata } = await api.getFileBlob(
  'downloadReport',
  { id: '12345' }
);

// Затем можно обработать файл или скачать его вручную
const url = URL.createObjectURL(data);
const a = document.createElement('a');
a.href = url;
a.download = metadata.fileName || 'report.xlsx';
a.click();
URL.revokeObjectURL(url);
```

### 2. Предпросмотр файлов в React

```tsx
function FilePreviewComponent({ fileId }) {
  const { 
    previewUrl,
    loadPreview,
    isLoading,
    cleanup
  } = useFilePreview(api.getEndpoints().getFile);
  
  // Загрузка превью при монтировании
  useEffect(() => {
    loadPreview({ id: fileId });
    return () => cleanup(); // Важно очистить ресурсы!
  }, [fileId]);
  
  if (isLoading) return <div>Загрузка предпросмотра...</div>;
  
  return (
    <div>
      {previewUrl && (
        <>
          {/* Для изображений */}
          <img src={previewUrl} alt="Preview" />
          
          {/* Для PDF */}
          <iframe src={previewUrl} width="100%" height="500px" />
        </>
      )}
    </div>
  );
}
```

### 3. Поддерживаемые форматы ответов

```typescript
// Доступные форматы ответа
export enum ResponseFormat {
  Json = 'json',           // JSON-объект (по умолчанию)
  Blob = 'blob',           // Blob для файлов
  ArrayBuffer = 'arrayBuffer', // ArrayBuffer для бинарных данных
  Text = 'text',           // Текстовый формат
  FormData = 'formData',   // FormData для форм
  Raw = 'raw'              // Без преобразования - сырой ответ
}
```

## Продвинутые возможности

### 1. Кэширование с учетом заголовков

Модуль поддерживает кэширование с учетом определенных HTTP-заголовков:

```typescript
const api = new ApiClient({
  // Глобальные заголовки для кэширования
  cacheableHeaderKeys: ['authorization', 'x-api-version'],
  
  endpoints: (builder) => ({
    getUserProfile: builder.create({
      // Переопределение для конкретного эндпоинта
      cacheableHeaderKeys: ['x-user-preferences'] 
    })
  })
});
```

### 2. Инвалидация кэша

Существует несколько способов инвалидации кэша:

```typescript
// 1. Автоматическая инвалидация по тегам
endpoints: (builder) => ({
  getUsers: builder.create({
    tags: ['users']
  }),
  createUser: builder.create({
    invalidatesTags: ['users'] // Инвалидирует кэш по тегу
  })
})

// 2. Ручная инвалидация эндпоинта
await api.getEndpoints().getUsers.invalidate();

// 3. Инвалидация при ошибке
cache: {
  invalidateOnError: true // Глобальная настройка
}
```

### 3. Подготовка заголовков

Модуль поддерживает глобальную и специфичную для эндпоинта подготовку заголовков:

```typescript
// 1. Глобальные заголовки
baseQuery: {
  prepareHeaders: (headers, context) => {
    const token = context.getCookie('aupd_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}

// 2. Заголовки на уровне эндпоинта
endpoints: (builder) => ({
  adminOperation: builder.create({
    prepareHeaders: (headers, context) => {
      headers.set('X-Admin-Key', context.getFromStorage('admin-key'));
      return headers;
    }
  })
})
```

### 4. Управление жизненным циклом

```typescript
// Проверка инициализации
if (!api.isInitialized()) {
  showLoadingIndicator();
}

// Ожидание инициализации
async function initializeApp() {
  await api.waitForInitialization();
  hideLoadingIndicator();
}

// Освобождение ресурсов
function cleanup() {
  api.dispose();
}
```

## Примеры использования с реальным API

### Пример работы с отчетами

```typescript
const reportApi = new ApiClient({
  storageType: 'indexedDB',
  baseQuery: {
    baseUrl: '/api',
    prepareHeaders: (headers, context) => {
      const token = context.getCookie('aupd_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      const currentRole = context.getCookie('aupd_current_role');
      if (currentRole) {
        headers.set('X-MES-HOSTID', currentRole.split(':')[0]);
      }
      
      headers.set('X-MES-SUBSYSTEM', 'MES');
      return headers;
    }
  },
  endpoints: (builder) => ({
    // Получение списка экзаменационных предметов в Excel
    getExaminationSubjectsReport: builder.create({
      request: (params: { schoolId: number, level: number }) => ({
        path: '/examination_subjects/report',
        method: 'GET',
        query: params,
        responseFormat: ResponseFormat.Blob,
        fileName: `examination-subjects-${params.schoolId}-${params.level}.xlsx`
      }),
      cache: { ttl: 0 }
    })
  })
});

// Использование в компоненте
function ExaminationReportButton({ schoolId, level }) {
  const { state, download } = useFileDownload(
    reportApi.getEndpoints().getExaminationSubjectsReport
  );
  
  return (
    <button 
      onClick={() => download({ schoolId, level })}
      disabled={state.isLoading}
    >
      {state.isLoading ? 'Скачивание...' : 'Скачать отчет'}
    </button>
  );
}
```

### Пример получения и обработки файла

```typescript
async function processExaminationReport(schoolId: number, level: number) {
  try {
    // Получаем файл как Blob без скачивания
    const { data, metadata } = await reportApi.getFileBlob(
      'getExaminationSubjectsReport',
      { schoolId, level }
    );
    
    // Можно выполнить дополнительную обработку
    console.log(`Получен файл ${metadata.fileName}, размер: ${metadata.size} байт`);
    
    // Если это Excel-файл, можно обработать его с помощью библиотеки SheetJS
    if (metadata.fileType.includes('spreadsheetml') || 
        metadata.fileType.includes('excel')) {
      const arrayBuffer = await data.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Обработка данных из Excel
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Дальнейшая обработка данных
      return {
        fileName: metadata.fileName,
        data: jsonData,
        rowCount: jsonData.length
      };
    }
    
    return { fileName: metadata.fileName };
  } catch (error) {
    console.error('Ошибка обработки отчета:', error);
    throw error;
  }
}
```

## Лучшие практики

### Организация эндпоинтов

Группируйте эндпоинты логически и используйте теги для связывания кэша:

```typescript
endpoints: (builder) => ({
  // Пользователи
  getUser: builder.create({
    tags: ['user']
  }),
  getUsers: builder.create({
    tags: ['users-list']
  }),
  updateUser: builder.create({
    invalidatesTags: ['user', 'users-list']
  }),
  
  // Отчеты
  getReports: builder.create({
    tags: ['reports-list']
  }),
  getReport: builder.create({
    tags: ['report']
  }),
  generateReport: builder.create({
    invalidatesTags: ['report', 'reports-list']
  })
})
```

### Оптимизация кэширования

```typescript
// Редко изменяемые данные - длительное кэширование
getMasterData: builder.create({
  cache: { ttl: 24 * 60 * 60 * 1000 }, // 24 часа
}),

// Файлы не кэшируем
downloadFile: builder.create({
  cache: { ttl: 0 },
}),

// Для чувствительных данных - кэширование с учетом заголовков авторизации
getUserSecrets: builder.create({
  cacheableHeaderKeys: ['authorization', 'x-session-id']
})
```

### Работа с файлами

```typescript
// 1. Для скачивания файлов используйте responseFormat и fileName
downloadReport: builder.create({
  request: (params) => ({
    responseFormat: ResponseFormat.Blob,
    fileName: `report-${params.reportId}.xlsx`
  })
})

// 2. Для предпросмотра файлов используйте useFilePreview
function PreviewComponent() {
  const { previewUrl, loadPreview, cleanup } = useFilePreview(endpoint);
  
  useEffect(() => {
    loadPreview(params);
    return () => cleanup(); // Обязательно освобождаем ресурсы!
  }, []);
}

// 3. Очищайте URL объекты после использования
const url = URL.createObjectURL(blob);
// ... использование url
URL.revokeObjectURL(url); // Не забывайте освобождать ресурсы!
```

## Расширение функциональности

### Добавление поддержки WebSocket

```typescript
class WebSocketApiClient<T> extends ApiClient<T> {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  
  constructor(options: TypedApiModuleOptions<T>) {
    super(options);
  }
  
  /**
   * Подключение к WebSocket серверу
   */
  public connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        resolve();
      };
      
      this.socket.onerror = (error) => {
        reject(error);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type && this.messageHandlers.has(message.type)) {
            this.messageHandlers.get(message.type)?.(message.data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
    });
  }
  
  /**
   * Подписка на сообщения определенного типа
   */
  public subscribe<TData>(
    messageType: string,
    handler: (data: TData) => void
  ): () => void {
    this.messageHandlers.set(messageType, handler as any);
    
    return () => {
      this.messageHandlers.delete(messageType);
    };
  }
  
  /**
   * Отправка сообщения
   */
  public send(type: string, data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket не подключен');
    }
    
    this.socket.send(JSON.stringify({ type, data }));
  }
  
  /**
   * Закрытие соединения
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.messageHandlers.clear();
  }
  
  /**
   * Переопределение dispose для освобождения ресурсов WebSocket
   */
  public override dispose(): void {
    this.disconnect();
    super.dispose();
  }
}
```

### Расширение для работы с GraphQL

```typescript
class GraphQLApiClient<T> extends ApiClient<T> {
  /**
   * Выполнение GraphQL-запроса
   */
  public async query<TData, TVariables>(
    query: string,
    variables?: TVariables,
    options?: RequestOptions
  ): Promise<TData> {
    const endpoints = this.getEndpoints();
    
    // Используем общий эндпоинт для GraphQL запросов
    if (!endpoints.graphqlQuery) {
      throw new Error('GraphQL endpoint не определен');
    }
    
    const result = await endpoints.graphqlQuery.fetch({
      query,
      variables
    }, options);
    
    // Обработка ошибок GraphQL
    if (result.errors && result.errors.length > 0) {
      const error = new Error(result.errors[0].message);
      (error as any).graphQLErrors = result.errors;
      throw error;
    }
    
    return result.data as TData;
  }
  
  /**
   * Выполнение GraphQL-мутации
   */
  public async mutate<TData, TVariables>(
    mutation: string,
    variables?: TVariables,
    options?: RequestOptions
  ): Promise<TData> {
    return this.query<TData, TVariables>(mutation, variables, options);
  }
}
```

## Заключение

API-модуль предоставляет гибкую и расширяемую систему для работы с HTTP-запросами, файлами и кэшированием. Благодаря типизации и поддержке React-хуков, он значительно упрощает взаимодействие с API в современных веб-приложениях. Модуль спроектирован с учетом масштабируемости и производительности, что делает его подходящим для сложных корпоративных приложений.

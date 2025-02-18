import { QueryModule, fetchBaseQuery } from './index'

/**
 * Пример использования QueryModule с кэшированием
 */
async function exampleUsage() {
  // 1. Создаем экземпляр QueryModule
  const api = new QueryModule({
    storageType: 'indexedDB', // Используем IndexedDB для хранения
    options: {
      name: 'api-storage', // Необходимое имя хранилища
      dbName: 'api-cache',
      storeName: 'requests',
      dbVersion: 1
    },
    // Настройки кэширования
    cache: {
      ttl: 1000 * 60 * 30, // Глобальное время жизни кэша - 30 минут
      cleanup: {
        enabled: true,
        interval: 1000 * 60 * 60, // Очистка раз в час
      },
      invalidateOnError: true, // Инвалидация кэша при ошибках
    },
    // Базовый запрос с настройками
    baseQuery: fetchBaseQuery({
      baseUrl: 'https://api.example.com',
      prepareHeaders: (headers) => {
        // Добавляем заголовки авторизации
        const token = localStorage.getItem('token');
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      }
    }),
    // Описание эндпоинтов
    endpoints: () => ({
      // Получение списка пользователей
      getUsers: {
        request: (params?: { page?: number, limit?: number }) => ({
          path: '/users',
          method: 'GET',
          query: params
        }),
        // Кэш для этого эндпоинта живет 5 минут
        cache: { ttl: 1000 * 60 * 5 },
        // Теги для группировки кэша
        tags: ['users']
      },
      
      // Получение одного пользователя
      getUserById: {
        request: (id: number) => ({
          path: `/users/${id}`,
          method: 'GET'
        }),
        // Кэш для этого эндпоинта живет 10 минут
        cache: { ttl: 1000 * 60 * 10 },
        // Теги для группировки кэша
        tags: ['user']
      },
      
      // Обновление пользователя
      updateUser: {
        request: (data: { id: number, name: string }) => ({
          path: `/users/${data.id}`,
          method: 'PUT',
          body: data
        }),
        // Этот эндпоинт инвалидирует кэш с тегами 'user' и 'users'
        invalidatesTags: ['user', 'users']
      }
    })
  })

  // 2. Использование API после инициализации
  // Получаем типизированный доступ к эндпоинтам
  const endpoints = api.getEndpoints<{
    getUsers: { request: (params?: { page?: number, limit?: number }) => any, cache: any },
    getUserById: { request: (id: number) => any, cache: any },
    updateUser: { request: (data: { id: number, name: string }) => any }
  }>()

  try {
    // Получение данных (будет кэшироваться)
    const users = await endpoints.getUsers.fetch({ page: 1, limit: 10 })
    console.log('Users:', users)

    // Получение пользователя (будет кэшироваться)
    const user = await endpoints.getUserById.fetch(1)
    console.log('User 1:', user)

    // Получение из кэша (если прошло меньше TTL)
    const cachedUser = await endpoints.getUserById.fetch(1)
    console.log('Cached user:', cachedUser)

    // Обновление пользователя (инвалидирует кэш)
    await endpoints.updateUser.fetch({ id: 1, name: 'Updated Name' })
    
    // Получение снова - кэш инвалидирован, будет новый запрос
    const updatedUser = await endpoints.getUserById.fetch(1)
    console.log('Updated user:', updatedUser)

    // Отключение кэширования для конкретного запроса
    const freshUsers = await endpoints.getUsers.fetch({ page: 1 }, { disableCache: true })
    console.log('Fresh users:', freshUsers)

    // Отмена запроса
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 100)
    
    try {
      await endpoints.getUsers.fetch({ page: 2 }, { signal: controller.signal })
    } catch (error) {
      console.log('Request was aborted')
    }

  } catch (error) {
    console.error('API Error:', error)
  }
}

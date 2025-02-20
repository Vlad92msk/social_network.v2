import { ApiClient } from './index'

/**
 * Пример использования ApiClient с билдером эндпоинтов
 */

// Определяем типы данных
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface GetUsersParams {
  page?: number;
  limit?: number;
  filter?: string;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

async function example() {
  // Создаем API с типизацией используя builder pattern
  const api = new ApiClient({
    storageType: 'indexedDB',
    options: {
      name: 'user-api-storage',
      dbName: 'user-api-cache',
      storeName: 'requests',
      dbVersion: 1,
    },
    // Глобальная настройка заголовков для кэша
    cacheableHeaderKeys: ['authorization', 'x-client-version'],
    // Настройки кэширования
    cache: {
      ttl: 1000 * 60 * 30, // 30 минут
      cleanup: {
        enabled: true,
        interval: 1000 * 60 * 60, // Очистка раз в час
      },
      invalidateOnError: true,
    },
    // Базовый запрос
    baseQuery: {
      baseUrl: 'https://api.example.com/v1',
      // Формирование заголовков - с типизированным контекстом
      prepareHeaders: (headers, context) => {
        // Токен из localStorage
        const token = context.getFromStorage('token')
        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }

        // Cookie из контекста
        const authToken = context.getCookie?.('auth-token')
        if (authToken) {
          headers.set('X-Auth-Token', authToken)
        }

        // Добавляем версию клиента
        headers.set('X-Client-Version', '2.0.0')

        return headers
      },
    },
    // Типизированные endpoints с использованием builder
    endpoints: (builder) => ({
      getUsers: builder.create<GetUsersParams, UsersResponse>({
        request: (params = {}) => ({
          path: '/mes-api/users',
          method: 'GET',
          query: params,
        }),
        cache: { ttl: 1000 * 60 * 5 },
        tags: ['users'],
        cacheableHeaderKeys: ['authorization', 'x-mes-hostid', 'x-mes-subsystem'],
        prepareHeaders: (headers, context) => {
          headers.set('X-Pagination-Mode', 'cursor')
          headers.set('x-mes-subsystem', 'MES')

          // Типизированный context дает подсказки IDE
          const currentRole = context.getCookie?.('AUPD_CURRENT_ROLE')
          if (currentRole) {
            headers.set('x-mes-hostid', currentRole.split(':')[0])
          }

          return headers
        },
      }),

      // Еще один endpoint с точной типизацией
      getUserById: builder.create({
        request: (id: number) => ({
          path: `/mes-api/users/${id}`,
          method: 'GET',
        }),
        cache: { ttl: 1000 * 60 * 10 },
        tags: ['user'],
        prepareHeaders: (headers, context) => {
          headers.set('x-mes-subsystem', 'MES')
          return headers
        },
      }),

      // Endpoint для создания пользователя
      createUser: builder.create({
        request: (data: Omit<User, 'id'>) => ({
          path: '/mes-api/users',
          method: 'POST',
          body: data,
        }),
        prepareHeaders: (headers, context) => {
          headers.set('x-mes-subsystem', 'MES')

          // Добавляем CSRF защиту
          const csrfToken = context.getCookie?.('csrf-token')
          if (csrfToken) {
            headers.set('X-CSRF-Token', csrfToken)
          }

          return headers
        },
        invalidatesTags: ['users'],
      }),

      // Endpoint для обновления пользователя
      updateUser: builder.create({
        request: (data: User) => ({
          path: `/mes-api/users/${data.id}`,
          method: 'PUT',
          body: data,
        }),
        prepareHeaders: (headers, context) => {
          headers.set('x-mes-subsystem', 'MES')

          const csrfToken = context.getCookie?.('csrf-token')
          if (csrfToken) {
            headers.set('X-CSRF-Token', csrfToken)
          }

          return headers
        },
        invalidatesTags: ['user', 'users'],
      }),
    }),
  })

  // Получаем типизированные endpoints с полной поддержкой типов
  const endpoints = api.getEndpoints()

  // TypeScript знает все типы!
  try {
    // Полностью типизированный запрос и результат
    const usersResult = await endpoints.getUsers.fetch({
      page: 1,
      limit: 10,
      filter: 'active',
    })

    console.log(`Загружено ${usersResult.data.length} пользователей из ${usersResult.total}`)

    // TypeScript знает, что user имеет тип User
    if (usersResult.data.length > 0) {
      const user = usersResult.data[0]

      // TypeScript знает, что это метод принимает number
      const userDetails = await endpoints.getUserById.fetch(user.id)

      // TypeScript знает, что нужно передать User без id
      const newUser = await endpoints.createUser.fetch({
        name: 'Новый пользователь',
        email: 'new@example.com',
        role: 'user',
      })

      // Типизированное обновление
      await endpoints.updateUser.fetch({
        id: newUser.id,
        name: 'Обновленное имя',
        email: newUser.email,
        role: newUser.role,
      })
    }

    // Получение состояния эндпоинта (асинхронно)
    const state = await endpoints.getUsers.getState()
    console.log('Текущее состояние:', state.status)

    // Подписка на изменения
    const unsubscribe = endpoints.getUsers.subscribe((newState) => {
      console.log('Состояние изменилось:', newState.status)
    })

    // Отмена подписки при необходимости
    unsubscribe()
  } catch (error) {
    console.error('API Error:', error)
  }
}

export { example }

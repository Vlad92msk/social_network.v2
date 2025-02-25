import { createApiClient } from '../components/api-client'
import {
  createLoggerMiddleware,
  createAuthMiddleware,
  createCacheMiddleware,
  createRetryMiddleware
} from '@ui/modules/synapse/services/api/middleware/built-in-middlewares'

// Определяем типы для нашего API
interface User {
  id: number
  name: string
  email: string
}

interface Post {
  id: number
  userId: number
  title: string
  body: string
}

interface Comment {
  id: number
  postId: number
  name: string
  email: string
  body: string
}

// Параметры для различных эндпоинтов
interface GetPostsParams {
  userId?: number
}

// Создаем API клиент с типизацией
const apiClient = createApiClient({
  storageType: 'localStorage',
  baseQuery: {
    baseUrl: 'https://jsonplaceholder.typicode.com',
    timeout: 10000
  },
  cache: true,
  endpoints: (builder) => ({
    // Используем оригинальный подход с передачей типов в дженерики
    getUsers: builder.create<void, User[]>({
      request: () => ({
        path: '/users',
        method: 'GET'
      }),
      cache: true,
      tags: ['users']
    }),

    getUserById: builder.create<number, User>({
      request: (id) => ({
        path: `/users/${id}`,
        method: 'GET'
      }),
      cache: true,
      tags: ['users']
    }),

    getPosts: builder.create<GetPostsParams, Post[]>({
      request: (params = {}) => ({
        path: '/posts',
        method: 'GET',
        query: params.userId ? { userId: params.userId } : undefined
      }),
      cache: true,
      tags: ['posts']
    }),

    getComments: builder.create<number, Comment[]>({
      request: (postId) => ({
        path: '/comments',
        method: 'GET',
        query: { postId }
      }),
      cache: true,
      tags: ['comments']
    }),

    createPost: builder.create<Omit<Post, 'id'>, Post>({
      request: (post) => ({
        path: '/posts',
        method: 'POST',
        body: post
      }),
      cache: false,
      invalidatesTags: ['posts']
    }),

    updatePost: builder.create<Post, Post>({
      request: (post) => ({
        path: `/posts/${post.id}`,
        method: 'PUT',
        body: post
      }),
      cache: false,
      invalidatesTags: ['posts']
    }),

    deletePost: builder.create<number, {}>({
      request: (id) => ({
        path: `/posts/${id}`,
        method: 'DELETE'
      }),
      cache: false,
      invalidatesTags: ['posts']
    })
  })
})

// Добавляем middleware для логирования
apiClient.use(createLoggerMiddleware({
  logLevel: 'debug',
  includeHeaders: true,
  maskSensitiveData: false
}))

// Добавляем middleware для авторизации
apiClient.use(createAuthMiddleware(() => {
  return localStorage.getItem('auth_token') || ''
}))

// Добавляем middleware для кэширования
apiClient.use(createCacheMiddleware({
  ttl: 5 * 60 * 1000, // 5 минут
  maxSize: 100
}))

// Добавляем middleware для повторных попыток запроса
apiClient.use(createRetryMiddleware({
  maxRetries: 3,
  retryDelay: 1000
}))

// Пример использования API клиента
async function fetchData() {
  try {
    // Получаем пользователей
    const users = await apiClient.request('getUsers', undefined)
    console.log('Пользователи:', users)

    // Получаем посты пользователя с ID 1
    const userPosts = await apiClient.request('getPosts', { userId: 1 })
    console.log('Посты пользователя:', userPosts)

    // Создаем новый пост
    const newPost = await apiClient.request('createPost', {
      userId: 1,
      title: 'Новый пост',
      body: 'Содержание нового поста'
    })
    console.log('Создан новый пост:', newPost)

    // Получаем комментарии к посту
    const comments = await apiClient.request('getComments', newPost.id)
    console.log('Комментарии к посту:', comments)
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
  }
}

// Экспортируем для использования
export {
  apiClient,
  fetchData
}

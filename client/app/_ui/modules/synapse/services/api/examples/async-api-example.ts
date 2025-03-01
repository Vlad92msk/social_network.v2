import { createApiClient, createInitializedApiClient } from '../components/api-client'

// Типы данных для демонстрации
interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    name: string;
    url: string;
  }[];
}

interface PokemonDetails {
  id: number;
  name: string;
  height: number;
  weight: number;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }>;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
}

// Тип для конфигурации эндпоинтов
interface EndpointConfig {
  cache?: boolean | { ttl?: number };
  tags?: string[];
  invalidatesTags?: string[];
}

// Имитация загрузки конфигурации из файла
async function loadConfig() {
  // В реальном приложении здесь будет загрузка из файла или API
  return new Promise<{
    clusterName: string;
    version: string;
    headers: Record<string, string>;
    endpoints: Record<string, EndpointConfig>;
  }>((resolve) => {
    // Имитация задержки загрузки
    setTimeout(() => {
      resolve({
        clusterName: 'production-east',
        version: '1.0.0',
        headers: {
          'X-API-Version': '2.0',
          'X-Cluster': 'production-east',
          'X-Client': 'web-app',
        },
        endpoints: {
          getPokemonList: {
            cache: { ttl: 60 * 60 * 1000 }, // Кэшировать на 1 час
            tags: ['pokemon', 'list'],
          },
          getPokemonById: {
            cache: { ttl: 24 * 60 * 60 * 1000 }, // Кэшировать на сутки
            tags: ['pokemon', 'details'],
          },
        },
      })
    }, 500) // Имитируем задержку в 500 мс
  })
}

// Имитация загрузки токена авторизации
async function loadAuthToken() {
  // В реальном приложении здесь будет загрузка токена из хранилища токенов
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ')
    }, 300)
  })
}

/**
 * Пример использования API клиента с асинхронными endpoints и prepareHeaders
 */
async function exampleAsyncApi() {
  console.log('Начало инициализации API клиента...')

  // Загружаем конфигурацию перед созданием API клиента
  const config = await loadConfig()
  console.log(`Загружена конфигурация для кластера: ${config.clusterName}`)

  // Создаем API клиент с асинхронной конфигурацией
  const apiClient = await createInitializedApiClient({
    storageType: 'localStorage',
    cache: true,
    baseQuery: {
      baseUrl: 'https://pokeapi.co/api/v2',
      timeout: 15000,
      // Асинхронная функция prepareHeaders
      prepareHeaders: async (headers, context) => {
        console.log('Подготовка заголовков...')

        // Асинхронно загружаем токен авторизации
        const token = await loadAuthToken()
        console.log('Токен авторизации загружен')

        // Устанавливаем заголовки из конфигурации
        Object.entries(config.headers).forEach(([key, value]) => {
          headers.set(key, value)
        })

        // Добавляем заголовок авторизации
        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }

        // Добавляем заголовок для указания языка
        headers.set('Accept-Language', 'ru-RU')

        return headers
      },
    },
    // Асинхронная функция endpoints
    endpoints: async (create) => {
      console.log('Конфигурация эндпоинтов...')

      // Можно выполнить любые асинхронные операции для настройки эндпоинтов
      const endpointSettings = config.endpoints

      return {
        getPokemonList: create<void, PokemonListResponse>({
          request: () => ({
            path: '/pokemon',
            method: 'GET',
            query: { limit: 20, offset: 0 },
          }),
          cache: endpointSettings.getPokemonList?.cache || false,
          tags: endpointSettings.getPokemonList?.tags || [],
        }),

        getPokemonById: create<number, PokemonDetails>({
          request: (id) => ({
            path: `/pokemon/${id}`,
            method: 'GET',
          }),
          cache: endpointSettings.getPokemonById?.cache || false,
          tags: endpointSettings.getPokemonById?.tags || [],
        }),
      }
    },
  })

  console.log('API клиент полностью инициализирован')

  // Выполняем запрос
  try {
    console.log('Отправка запроса для получения списка покемонов...')
    const pokemonList = await apiClient.request('getPokemonList', undefined)
    console.log(`Получено ${pokemonList.results.length} покемонов`)

    // Выбираем первого покемона и делаем запрос для получения подробностей
    if (pokemonList.results.length > 0) {
      const firstPokemonUrl = pokemonList.results[0].url
      const pokemonId = parseInt(firstPokemonUrl.split('/').filter(Boolean).pop() || '1')

      console.log(`Получение данных о покемоне с ID ${pokemonId}...`)
      const pokemonDetails = await apiClient.request('getPokemonById', pokemonId)
      console.log(`Получены данные о покемоне ${pokemonDetails.name}`)

      return {
        list: pokemonList,
        details: pokemonDetails,
      }
    }

    return { list: pokemonList }
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error)
    throw error
  }
}

/**
 * Пример альтернативного использования без явного ожидания инициализации
 */
async function exampleImplicitInitialization() {
  console.log('Создание API клиента без явного ожидания инициализации...')

  // Загружаем конфигурацию перед созданием API клиента
  const config = await loadConfig()

  // Создаем API клиент без явного ожидания инициализации
  const apiClient = createApiClient({
    storageType: 'localStorage',
    cache: true,
    baseQuery: {
      baseUrl: 'https://pokeapi.co/api/v2',
      timeout: 15000,
      prepareHeaders: async (headers) => {
        const token = await loadAuthToken()

        Object.entries(config.headers).forEach(([key, value]) => {
          headers.set(key, value)
        })

        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }

        return headers
      },
    },
    endpoints: async (create) => {
      const endpointSettings = config.endpoints

      return {
        getPokemonById: create<number, PokemonDetails>({
          request: (id) => ({
            path: `/pokemon/${id}`,
            method: 'GET',
          }),
          cache: endpointSettings.getPokemonById?.cache || false,
          tags: endpointSettings.getPokemonById?.tags || [],
        }),
      }
    },
  })
  // Методы API клиента автоматически дождутся завершения инициализации
  try {
    console.log('Отправка запроса для получения данных о покемоне...')
    const pokemonDetails = await apiClient.request('getPokemonById', 25) // Pikachu
    console.log(`Получены данные о покемоне ${pokemonDetails.name}`)

    return pokemonDetails
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error)
    throw error
  }
}

// Экспортируем примеры для использования
export {
  exampleAsyncApi,
  exampleImplicitInitialization,
  loadConfig,
  loadAuthToken,
}

import { ApiClient } from '../components/api-client'
import { ApiContext } from '../types/api.interface'

// Типы данных для PokeAPI
interface PokemonDetails {
  id: number
  name: string
  // ... другие поля
}

// Тип конфигурации кластера
interface ClusterConfig {
  clusterName: string
  version: string
  headers: Record<string, string>
  settings: {
    timeout: number
    retryCount: number
    cacheEnabled: boolean
  }
}

/**
 * Загружает конфигурацию кластера из JSON файла в браузере
 */
async function loadClusterConfig(): Promise<ClusterConfig> {
  try {
    // В браузере используем fetch для загрузки конфигурации
    const response = await fetch('/api/config/cluster-config.json')
    if (!response.ok) {
      throw new Error(`Ошибка загрузки конфигурации: ${response.status} ${response.statusText}`)
    }
    return await response.json() as ClusterConfig
  } catch (error) {
    console.error('Ошибка загрузки конфигурации кластера:', error)
    // Возвращаем конфигурацию по умолчанию при ошибке
    return {
      clusterName: 'default',
      version: '1.0.0',
      headers: {
        'X-Cluster-ID': 'default-001',
        'X-API-Version': 'v1',
      },
      settings: {
        timeout: 10000,
        retryCount: 1,
        cacheEnabled: false,
      },
    }
  }
}

// Создаем синглтон конфигурации, чтобы загрузить её только один раз
let configPromise: Promise<ClusterConfig> | null = null

function getClusterConfig(): Promise<ClusterConfig> {
  if (!configPromise) {
    configPromise = loadClusterConfig()
  }
  return configPromise
}

/**
 * Создаёт экземпляр prepareHeaders, который загружает конфигурацию при первом вызове
 */
function createConfigAwarePrepareHeaders() {
  // При первом вызове prepareHeaders загрузим конфигурацию
  let cachedConfig: ClusterConfig | null = null
  let configLoading: Promise<ClusterConfig> | null = null

  return async (headers: Headers, context: ApiContext): Promise<Headers> => {
    // Если конфигурация еще не загружена, загружаем её
    if (!cachedConfig) {
      if (!configLoading) {
        configLoading = getClusterConfig()
      }

      try {
        cachedConfig = await configLoading
        console.log('Конфигурация загружена при первом вызове prepareHeaders')
      } catch (error) {
        console.error('Ошибка загрузки конфигурации:', error)
        // Используем пустой объект при ошибке, чтобы не блокировать запросы
        cachedConfig = {
          clusterName: 'error',
          version: '0.0.0',
          headers: {},
          settings: {
            timeout: 10000,
            retryCount: 0,
            cacheEnabled: false,
          },
        }
      }
    }

    // Добавляем заголовки из конфигурации кластера
    for (const [key, value] of Object.entries(cachedConfig.headers)) {
      headers.set(key, value)
    }

    // Добавляем токен авторизации, если есть
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return headers
  }
}

/**
 * Пример использования API клиента с асинхронной загрузкой конфигурации в браузере
 */
async function exampleBrowserAsyncConfig() {
  // Создаем функцию prepareHeaders, которая асинхронно загрузит конфигурацию
  // при первом вызове
  const prepareHeaders = createConfigAwarePrepareHeaders()

  // Создаем API клиент
  const apiClient = new ApiClient({
    storageType: 'localStorage',
    cache: true, // Настройка может быть обновлена позже через middleware
    baseQuery: {
      baseUrl: 'https://pokeapi.co/api/v2',
      timeout: 10000, // Будет обновлено из конфигурации через middleware
      prepareHeaders,
    },
    endpoints: (create) => ({
      getPokemonById: create<number, PokemonDetails>({
        request: (id) => ({
          path: `/pokemon/${id}`,
          method: 'GET',
        }),
        cache: true,
      }),
    }),
  })

  // Создаем middleware для обновления настроек из конфигурации
  apiClient.use({
    name: 'config-middleware',
    async setup({ execute }) {
      // Загружаем конфигурацию при инициализации middleware
      const config = await getClusterConfig()

      // Обновляем настройки таймаута и кэширования
      apiClient.setCacheableHeaderKeys(['X-Cluster-ID', 'X-API-Version'])

      console.log(`Middleware инициализирован с конфигурацией кластера: ${config.clusterName}`)
    },
    before: async (context) => {
      // Этот код будет выполнен перед каждым запросом
      // Можно обновить опции запроса на основе конфигурации
      const config = await getClusterConfig()

      if (config.settings.timeout) {
        context.options.timeout = config.settings.timeout
      }
    },
  })

  // Даже без явного ожидания инициализации, первый запрос будет работать корректно,
  // так как prepareHeaders загрузит конфигурацию при первом вызове
  const pikachu = await apiClient.request('getPokemonById', 25)
  console.log('Получены данные о покемоне:', pikachu.name)

  return pikachu
}

export { exampleBrowserAsyncConfig, createConfigAwarePrepareHeaders, getClusterConfig }

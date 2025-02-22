import { ApiClient } from '../components/api-client'
import { ApiContext } from '../types/api.interface'
import * as fs from 'fs/promises'
import * as path from 'path'

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
 * Загружает конфигурацию кластера из JSON файла
 */
async function loadClusterConfig(): Promise<ClusterConfig> {
  try {
    // В браузере мы бы использовали fetch или другой метод загрузки
    // Здесь для примера используем fs/promises, что работает только в Node.js
    const configPath = path.resolve(__dirname, '../config/cluster-config.json')
    const configContent = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(configContent) as ClusterConfig
  } catch (error) {
    console.error('Ошибка загрузки конфигурации кластера:', error)
    // Возвращаем конфигурацию по умолчанию при ошибке
    return {
      clusterName: 'default',
      version: '1.0.0',
      headers: {
        'X-Cluster-ID': 'default-001',
        'X-API-Version': 'v1'
      },
      settings: {
        timeout: 10000,
        retryCount: 1,
        cacheEnabled: false
      }
    }
  }
}

/**
 * Создаёт API клиент с асинхронно загружаемой конфигурацией
 */
async function createApiClientWithConfig() {
  // Загружаем конфигурацию кластера
  const clusterConfig = await loadClusterConfig()
  console.log('Загружена конфигурация кластера:', clusterConfig.clusterName)

  // Функция для подготовки заголовков с использованием загруженной конфигурации
  const prepareHeaders = (headers: Headers, context: ApiContext) => {
    // Добавляем заголовки из конфигурации кластера
    for (const [key, value] of Object.entries(clusterConfig.headers)) {
      headers.set(key, value)
    }

    // Добавляем токен авторизации, если есть
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return headers
  }

  // Создаем API клиент с загруженной конфигурацией
  const apiClient = new ApiClient({
    storageType: 'localStorage',
    cache: clusterConfig.settings.cacheEnabled,
    baseQuery: {
      baseUrl: 'https://pokeapi.co/api/v2',
      timeout: clusterConfig.settings.timeout,
      prepareHeaders
    },
    endpoints: (create) => ({
      getPokemonById: create<number, PokemonDetails>({
        request: (id) => ({
          path: `/pokemon/${id}`,
          method: 'GET'
        }),
        cache: true
      })
    })
  })

  return apiClient
}

/**
 * Пример использования API клиента с асинхронной конфигурацией
 */
async function exampleAsyncConfig() {
  try {
    // Создаем API клиент с асинхронной конфигурацией
    const apiClient = await createApiClientWithConfig()

    // Использование API клиента
    const pikachu = await apiClient.request('getPokemonById', 25)
    console.log('Получены данные о покемоне:', pikachu.name)

    return pikachu
  } catch (error) {
    console.error('Ошибка в примере:', error)
    throw error
  }
}

export { exampleAsyncConfig, createApiClientWithConfig }

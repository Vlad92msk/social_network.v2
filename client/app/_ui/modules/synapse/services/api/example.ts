/**
 * Пример использования ApiClient с билдером эндпоинтов и настройками кэширования
 */
import { ApiClient } from './components/api-client'

// Типы данных для PokeAPI
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
  sprites: {
    front_default: string;
    back_default: string;
    other?: {
      'official-artwork'?: {
        front_default: string;
      }
    };
  };
  types: {
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }[];
  abilities: {
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }[];
  stats: {
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }[];
}

interface PokemonSearchParams {
  limit?: number;
  offset?: number;
}

async function example() {
  // По умолчанию кэширование отключено (cache: false)
  const pokeApi = new ApiClient({
    storageType: 'indexedDB',
    options: {
      name: 'pokemon-api-storage',
      dbName: 'pokemon-api-cache',
      storeName: 'requests',
      dbVersion: 1,
    },
    // Кэширование явно отключено по умолчанию
    cache: false,
    // Базовый запрос
    baseQuery: {
      baseUrl: 'https://pokeapi.co/api/v2',
      // Таймаут запроса в миллисекундах
      timeout: 10000,
      prepareHeaders: async (headers) => headers,
    },
    // Типизированные endpoints с использованием builder
    endpoints: async (create) => ({
      // Запрос списка покемонов (без кэширования)
      getPokemonList: create<PokemonSearchParams, PokemonListResponse>({
        request: (params = { limit: 20, offset: 0 }) => ({
          path: '/pokemon',
          method: 'GET',
          query: params,
        }),
        // Явное отключение кэша для этого эндпоинта
        cache: false,
      }),

      // Запрос деталей покемона по имени (с кэшированием)
      getPokemonByName: create<string, PokemonDetails>({
        request: (name) => ({
          path: `/pokemon/${name}`,
          method: 'GET',
        }),
        // Явное включение кэша с TTL 1 час
        cache: {
          ttl: 60 * 60 * 1000,
        },
        tags: ['pokemon-details'],
      }),

      // Запрос деталей покемона по ID (с кэшированием - boolean вариант)
      getPokemonById: create<number, PokemonDetails>({
        request: (id) => ({
          path: `/pokemon/${id}`,
          method: 'GET',
        }),
        // Включаем кэширование с настройками по умолчанию
        cache: true,
        tags: ['pokemon-details'],
      }),

      // Запрос типов покемонов (без кэша)
      getPokemonTypes: create<void, { results: { name: string; url: string }[] }>({
        request: () => ({
          path: '/type',
          method: 'GET',
        }),
      }),
    }),
  })

  // Получаем типизированные endpoints
  const endpoints = pokeApi.getEndpoints()
  const list = pokeApi.getEndpoints().getPokemonList
  const в = list.fetch({})
}

export { example }

import { ResponseFormat } from '@ui/modules/synapse/services/api'
import { ApiClient } from '../components/api-client'

// Типы данных для PokeAPI
export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    name: string;
    url: string;
  }[];
}

export interface PokemonDetails {
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

export interface PokemonSearchParams {
  limit?: number;
  offset?: number;
}

export const api = new ApiClient({
  cacheableHeaderKeys: ['X-Global-Header'],
  storageType: 'indexedDB',
  options: {
    name: 'pokemon-api-storage',
    dbName: 'pokemon-api-cache',
    storeName: 'requests',
    dbVersion: 1,
  },
  // Кэширование может быть включено/отключено при создании
  cache: true,
  // Базовый запрос
  baseQuery: {
    baseUrl: 'https://pokeapi.co/api/v2',
    timeout: 10000,
    cacheableHeaderKeys: ['X-Global-Header'], // Заголовок для базового запроса
    prepareHeaders: async (headers, context) => {
      // Устанавливаем заголовки для тестирования
      headers.set('X-Global-Header', 'global-value')
      headers.set('X-BaseQuery-Header', 'basequery-value')
      return headers
    },
    credentials: 'same-origin',
  },
  // Типизированные endpoints
  endpoints: async (create) => ({
    // Запрос деталей покемона по ID (с явно включенным кэшированием)
    getPokemonById: create<number, PokemonDetails>({
      cacheableHeaderKeys: ['X-Global-Header'],
      request: (id) => ({
        path: `/pokemon/${id}`,
        method: 'GET',
        responseFormat: ResponseFormat.Json,
      }),
      // Включаем кэширование с настройками по умолчанию
      cache: true,
      tags: ['pokemon-details'],
    }),
    // Запрос списка покемонов (без кэширования)
    getPokemonList: create<PokemonSearchParams, PokemonListResponse>({
      request: (params = {
        limit: 20,
        offset: 0,
      }) => ({
        path: '/pokemon',
        method: 'GET',
        query: params,
        responseFormat: ResponseFormat.Json,
      }),
      // Явное отключение кэша для этого эндпоинта
      // cache: false,
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

    // Запрос типов покемонов (без кэша)
    getPokemonTypes: create<void, { results: { name: string; url: string }[] }>({
      request: () => ({
        path: '/type',
        method: 'GET',
      }),
      // Кэш не определен, используется глобальная настройка
    }),
  }),
})
console.log('Starting API initialization...')
export const pokemonApi = await api.init()
console.log('API initialization completed')



console.log('Getting endpoints...')
export const pokemonEndpoints = pokemonApi.getEndpoints()

const dwed = pokemonEndpoints.getPokemonById
console.log('Endpoints received')

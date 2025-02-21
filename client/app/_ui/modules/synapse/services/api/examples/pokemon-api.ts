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

export const pokemonApi = new ApiClient({
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
  },
  // Типизированные endpoints
  endpoints: (builder) => ({
    // Запрос списка покемонов (без кэширования)
    getPokemonList: builder.create<PokemonSearchParams, PokemonListResponse>({
      request: (params = {
        limit: 20,
        offset: 0,
      }) => ({
        path: '/pokemon',
        method: 'GET',
        query: params,
      }),
      // Явное отключение кэша для этого эндпоинта
      cache: false,
    }),

    // Запрос деталей покемона по имени (с кэшированием)
    getPokemonByName: builder.create<string, PokemonDetails>({
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

    // Запрос деталей покемона по ID (с явно включенным кэшированием)
    getPokemonById: builder.create<number, PokemonDetails>({
      request: (id) => ({
        path: `/pokemon/${id}`,
        method: 'GET',
      }),
      // Включаем кэширование с настройками по умолчанию
      cache: true,
      tags: ['pokemon-details'],
    }),

    // Запрос типов покемонов (без кэша)
    getPokemonTypes: builder.create<void, { results: { name: string; url: string }[] }>({
      request: () => ({
        path: '/type',
        method: 'GET',
      }),
      // Кэш не определен, используется глобальная настройка
    }),
  }),
})

export const pokemonEndpoints = pokemonApi.getEndpoints()
export type UsersApiType = typeof pokemonApi

import { ApiClient } from './index'

/**
 * Пример использования ApiClient с билдером эндпоинтов и настройками кэширования
 */

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
  // Создаем API с типизацией используя builder pattern
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
    },
    // Типизированные endpoints с использованием builder
    endpoints: (create) => ({
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
        // Кэш не определен, будет использоваться глобальная настройка (отключено)
      }),
    }),
  })

  // Получаем типизированные endpoints
  const endpoints = pokeApi.getEndpoints()
  const byId = pokeApi.getEndpoints().getPokemonById
  // pokeApi.getEndpoints()
  // pokeApi.createEndpoint()
  // pokeApi.getCacheableHeaderKeys()
  // pokeApi.request()
  // pokeApi.isInitialized()
  // pokeApi.waitForInitialization()
  // pokeApi.dispose()
  // pokeApi.setCacheableHeaderKeys()
  // try {
  //   // Получаем список покемонов (без кэширования)
  //   const pokemonList = await endpoints.getPokemonList.fetch({ limit: 10 })
  //   console.log(`Найдено ${pokemonList.count} покемонов. Отображаем первые 10:`)
  //
  //   // Получаем детали для нескольких покемонов с кэшированием
  //   const detailsPromises = pokemonList.results.slice(0, 3).map(async (pokemon) => {
  //     // Этот запрос будет кэшироваться
  //     const details = await endpoints.getPokemonByName.fetch(pokemon.name)
  //     return {
  //       id: details.id,
  //       name: details.name,
  //       types: details.types.map((t) => t.type.name).join(', '),
  //       height: details.height / 10, // Переводим в метры
  //       weight: details.weight / 10, // Переводим в кг
  //     }
  //   })
  //
  //   const detailedPokemon = await Promise.all(detailsPromises)
  //   console.table(detailedPokemon)
  //
  //   // Получаем детали по ID (с использованием другого типа кэширования)
  //   const pikachuDetails = await endpoints.getPokemonById.fetch(25) // Pikachu
  //   console.log('Детали Пикачу:', {
  //     name: pikachuDetails.name,
  //     height: pikachuDetails.height / 10,
  //     weight: pikachuDetails.weight / 10,
  //     abilities: pikachuDetails.abilities.map((a) => a.ability.name).join(', '),
  //   })
  //
  //   // Этот запрос не будет кэшироваться (согласно глобальной настройке)
  //   const types = await endpoints.getPokemonTypes.fetch()
  //   console.log(`Доступно ${types.results.length} типов покемонов`)
  //
  //   // Второй запрос к кэшированному эндпоинту (будет использовать кэш)
  //   console.log('Повторный запрос (из кэша):')
  //   const cachedPikachu = await endpoints.getPokemonById.fetch(25)
  //   console.log(`Пикачу (из кэша): ${cachedPikachu.name}`)
  //
  //   // Пример с временной отменой кэширования через опции запроса
  //   const forcedPikachu = await endpoints.getPokemonById.fetch(25, { disableCache: true })
  //   console.log(`Пикачу (запрос с отключенным кэшем): ${forcedPikachu.name}`)
  //
  //   // Пример инвалидации кэша по тегам
  //   await endpoints.getPokemonByName.invalidate()
  //   console.log('Кэш invalidated по тегам pokemon-details')
  // } catch (error) {
  //   console.error('API Error:', error)
  // }

}

export { example }

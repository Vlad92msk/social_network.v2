import {
  ApiContext,
  BaseQueryFn,
  FetchBaseQueryArgs,
  filterCacheableHeaders,
  headersToObject,
  QueryResult,
  RequestDefinition, RequestOptions,
} from '../types/api.interface'

/**
 * Извлекает данные из response в зависимости от Content-Type
 */
async function getResponseData<T, E>(response: Response): Promise<{ data?: T, error?: E }> {
  const contentType = response.headers.get('content-type')

  try {
    if (contentType?.includes('application/json')) {
      const data = await response.json()
      return response.ok
        ? { data: data as T }
        : { error: data as E }
    } if (contentType?.includes('text/')) {
      const text = await response.text()
      return response.ok
        ? { data: text as unknown as T }
        : { error: text as unknown as E }
    } if (contentType?.includes('multipart/form-data')) {
      const formData = await response.formData()
      return response.ok
        ? { data: formData as unknown as T }
        : { error: formData as unknown as E }
    }
    const blob = await response.blob()
    return response.ok
      ? { data: blob as unknown as T }
      : { error: blob as unknown as E }
  } catch (err) {
    return response.ok
      ? { data: undefined }
      : { error: err as E }
  }
}

/**
 * Создает базовый fetch-клиент для запросов
 * @param options Настройки базового клиента
 */
export function fetchBaseQuery(options: FetchBaseQueryArgs): BaseQueryFn {
  const {
    baseUrl,
    prepareHeaders,
    timeout = 30000,
    fetchFn = fetch,
    cacheableHeaderKeys = [],
  } = options

  return async <T, E>(
    args: RequestDefinition,
    queryOptions: RequestOptions = {},
    context: ApiContext = {} as ApiContext,
  ): Promise<QueryResult<T, E>> => {
    const { path, method, body, query } = args
    const {
      signal,
      timeout: requestTimeout = timeout,
      headers: optionHeaders,
      context: optionContext = {},
      cacheableHeaderKeys: requestCacheableHeaderKeys,
    } = queryOptions

    // Объединяем контексты
    const headerContext: ApiContext = {
      ...context,
      ...optionContext,
      getFromStorage: (key: string) => {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : undefined
      },
      getCookie: (name: string) => {
        const matches = document.cookie.match(
          new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`),
        )
        return matches ? decodeURIComponent(matches[1]) : undefined
      },
      requestParams: { ...args, ...queryOptions },
    }

    // Строим URL с учетом api параметров
    const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`)

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((item) => url.searchParams.append(key, String(item)))
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      })
    }

    // Формируем заголовки
    let headers = new Headers()

    // Добавляем заголовки из определения запроса
    if (args.headers) {
      Object.entries(args.headers).forEach(([key, value]) => {
        headers.set(key, value)
      })
    }

    // Добавляем заголовки из опций запроса
    if (optionHeaders) {
      Object.entries(optionHeaders).forEach(([key, value]) => {
        headers.set(key, value)
      })
    }

    // Применяем глобальную подготовку заголовков
    if (prepareHeaders) {
      headers = prepareHeaders(headers, headerContext)
    }

    // Если body это объект, конвертируем в JSON и устанавливаем Content-Type
    let serializedBody: string | FormData | undefined
    if (body !== undefined) {
      if (body instanceof FormData) {
        serializedBody = body
      } else if (typeof body === 'object' && body !== null) {
        serializedBody = JSON.stringify(body)
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json')
        }
      } else {
        serializedBody = String(body)
      }
    }

    // Преобразуем заголовки для метаданных
    const headerObj = headersToObject(headers)

    // Определяем, какие заголовки влияют на кэш
    // (приоритет: опции запроса > глобальные настройки)
    const effectiveCacheableKeys = requestCacheableHeaderKeys || cacheableHeaderKeys
    const cacheableHeaders = filterCacheableHeaders(headerObj, effectiveCacheableKeys)

    // Создаем таймаут если указан
    let timeoutId: NodeJS.Timeout | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      if (requestTimeout) {
        timeoutId = setTimeout(() => {
          reject(new Error(`Request timeout after ${requestTimeout}ms`))
        }, requestTimeout)
      }
    })

    try {
      // Выполняем запрос с таймаутом
      const fetchPromise = fetchFn(url.toString(), {
        method,
        headers,
        body: serializedBody,
        signal,
        credentials: 'include',
      })

      const response = await Promise.race([fetchPromise, timeoutPromise])

      // Обрабатываем ответ
      const responseData = await getResponseData<T, E>(response)

      return {
        data: responseData.data,
        error: responseData.error,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        //@ts-ignore
        metadata: {
          requestHeaders: headerObj,
          cacheableHeaders,
        },
      }
    } catch (err) {
      // Обрабатываем ошибки сети или таймаута
      const error = err as Error
      return {
        error: error as E,
        ok: false,
        status: 0,
        statusText: error.message,
        headers: new Headers(),
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }
}

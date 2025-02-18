import {
  BaseQueryFn,
  FetchBaseQueryArgs,
  QueryResult,
  RequestDefinition,
  RequestOptions,
} from './query.interface'

/**
 * Создает базовый fetch-клиент для запросов
 * @param options Настройки базового клиента
 */
export function fetchBaseQuery(options: FetchBaseQueryArgs): BaseQueryFn {
  const { baseUrl, prepareHeaders, timeout = 30000, fetchFn = fetch } = options

  return async <T, E>(
    args: RequestDefinition,
    queryOptions: RequestOptions = {},
  ): Promise<QueryResult<T, E>> => {
    const { path, method, body, query, headers: customHeaders } = args
    const { signal, timeout: requestTimeout = timeout } = queryOptions

    // Строим URL с учетом query параметров
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

    // Готовим заголовки
    const headers = new Headers(customHeaders)

    // Если body это объект, конвертируем в JSON и устанавливаем Content-Type
    let serializedBody: string | FormData | undefined
    if (body !== undefined) {
      if (body instanceof FormData) {
        serializedBody = body
      } else if (typeof body === 'object' && body !== null) {
        serializedBody = JSON.stringify(body)
        headers.set('Content-Type', 'application/json')
      } else {
        serializedBody = String(body)
      }
    }

    // Применяем пользовательскую функцию подготовки заголовков
    const preparedHeaders = prepareHeaders
      ? prepareHeaders(headers, { getToken: () => localStorage.getItem('token') || '' })
      : headers

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
        headers: preparedHeaders,
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

import { ApiContext, FetchBaseQueryArgs, BaseQueryFn, RequestDefinition, RequestOptions, QueryResult, ResponseFormat } from '../types/api.interface';
import { filterCacheableHeaders, headersToObject } from './api-helpers';
import { getFileMetadataFromHeaders, getResponseFormatForMimeType, isFileResponse } from './file-utils';

/**
 * Извлекает данные из response в зависимости от формата
 * @param response Объект Response
 * @param format Формат ответа
 * @returns Объект с данными или ошибкой
 */
async function getResponseData<T, E>(
  response: Response,
  format?: ResponseFormat,
): Promise<{ data?: T, error?: E, fileMetadata?: any }> {
  let responseFormat = format;
  const contentType = response.headers.get('content-type') || '';

  // Если формат не указан, пытаемся определить его из MIME-типа
  if (!responseFormat && contentType) {
    // Проверка, является ли ответ файлом на основе заголовков
    if (isFileResponse(response.headers)) {
      responseFormat = ResponseFormat.Blob;
    } else {
      responseFormat = getResponseFormatForMimeType(contentType);
    }
  }

  // Если формат всё ещё не определен, используем JSON по умолчанию
  if (!responseFormat) {
    responseFormat = ResponseFormat.Json;
  }

  try {
    // Получение метаданных файла, если формат указывает на файл
    let fileMetadata;
    if (responseFormat === ResponseFormat.Blob || responseFormat === ResponseFormat.ArrayBuffer) {
      fileMetadata = getFileMetadataFromHeaders(response.headers);
    }

    // Обработка данных в зависимости от формата
    switch (responseFormat) {
      case ResponseFormat.Json: {
        // Пробуем получить JSON-данные
        try {
          const data = await response.json();
          return response.ok
            ? { data: data as T, fileMetadata }
            : { error: data as E, fileMetadata };
        } catch (error) {
          // Если не удалось разобрать JSON, возвращаем текст
          const text = await response.text();
          return response.ok
            ? { data: text as unknown as T, fileMetadata }
            : { error: text as unknown as E, fileMetadata };
        }
      }

      case ResponseFormat.Text: {
        const text = await response.text();
        return response.ok
          ? { data: text as unknown as T, fileMetadata }
          : { error: text as unknown as E, fileMetadata };
      }

      case ResponseFormat.Blob: {
        const blob = await response.blob();
        return response.ok
          ? { data: blob as unknown as T, fileMetadata }
          : { error: blob as unknown as E, fileMetadata };
      }

      case ResponseFormat.ArrayBuffer: {
        const buffer = await response.arrayBuffer();
        return response.ok
          ? { data: buffer as unknown as T, fileMetadata }
          : { error: buffer as unknown as E, fileMetadata };
      }

      case ResponseFormat.FormData: {
        const formData = await response.formData();
        return response.ok
          ? { data: formData as unknown as T, fileMetadata }
          : { error: formData as unknown as E, fileMetadata };
      }

      case ResponseFormat.Raw: {
        return response.ok
          ? { data: response as unknown as T, fileMetadata }
          : { error: response as unknown as E, fileMetadata };
      }

      default:
        // Если формат неизвестен, возвращаем blob как наиболее универсальный
        const blob = await response.blob();
        return response.ok
          ? { data: blob as unknown as T, fileMetadata }
          : { error: blob as unknown as E, fileMetadata };
    }
  } catch (err) {
    console.error(`[API] Ошибка извлечения данных из ответа (формат: ${responseFormat})`, err);
    return response.ok
      ? { data: undefined }
      : { error: err as E };
  }
}

/**
 * Создает базовый fetch-клиент для запросов с поддержкой файлов
 * @param options Настройки базового клиента
 * @returns Функция для выполнения запросов
 */
export function fetchBaseQuery(options: FetchBaseQueryArgs): BaseQueryFn {
  const {
    baseUrl,
    prepareHeaders,
    timeout = 30000,
    fetchFn = fetch,
    cacheableHeaderKeys = [],
    credentials = 'same-origin',
  } = options;

  return async <T, E>(
    args: RequestDefinition,
    queryOptions: RequestOptions = {},
    context: ApiContext = {} as ApiContext,
  ): Promise<QueryResult<T, E>> => {
    const {
      path,
      method,
      body,
      query,
      responseFormat: reqResponseFormat,
    } = args;

    const {
      signal,
      timeout: requestTimeout = timeout,
      headers: optionHeaders,
      context: optionContext = {},
      cacheableHeaderKeys: requestCacheableHeaderKeys,
      responseFormat: optResponseFormat,
    } = queryOptions;

    // Определяем формат ответа с приоритетом от options
    const responseFormat = optResponseFormat || reqResponseFormat;

    // Создаем расширенный контекст для подготовки заголовков
    const headerContext: ApiContext = {
      ...context,
      ...optionContext,
      getFromStorage: context.getFromStorage || ((key: string) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : undefined;
        } catch (error) {
          console.warn(`[API] Ошибка чтения из localStorage: ${error}`);
          return undefined;
        }
      }),
      getCookie: context.getCookie || ((name: string) => {
        try {
          const matches = document.cookie.match(
            new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`),
          );
          return matches ? decodeURIComponent(matches[1]) : undefined;
        } catch (error) {
          console.warn(`[API] Ошибка чтения cookie: ${error}`);
          return undefined;
        }
      }),
      requestParams: { ...args, ...queryOptions },
    };

    // Строим URL с учетом api параметров
    const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`);

    // Добавляем query-параметры в URL
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((item) => url.searchParams.append(key, String(item)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    // Формируем заголовки
    let headers = new Headers();

    // Добавляем заголовки из определения запроса
    if (args.headers) {
      Object.entries(args.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Добавляем заголовки из опций запроса
    if (optionHeaders) {
      Object.entries(optionHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Применяем глобальную подготовку заголовков
    if (prepareHeaders) {
      try {
        // Ожидаем результат prepareHeaders, который может быть асинхронным
        headers = await Promise.resolve(prepareHeaders(headers, headerContext));
      } catch (error) {
        console.warn('[API] Ошибка при подготовке заголовков', error);
      }
    }

    // Если body это объект, конвертируем в JSON и устанавливаем Content-Type
    let serializedBody: string | FormData | Blob | undefined;
    if (body !== undefined) {
      if (body instanceof FormData || body instanceof Blob) {
        serializedBody = body;
      } else if (typeof body === 'object' && body !== null) {
        try {
          serializedBody = JSON.stringify(body);
          if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
          }
        } catch (error) {
          console.error('[API] Ошибка сериализации тела запроса', error);
          serializedBody = String(body);
        }
      } else {
        serializedBody = String(body);
      }
    }

    // Преобразуем заголовки для метаданных
    const headerObj = headersToObject(headers);

    // Определяем, какие заголовки влияют на кэш
    const effectiveCacheableKeys = requestCacheableHeaderKeys || cacheableHeaderKeys;
    const cacheableHeaders = filterCacheableHeaders(headerObj, effectiveCacheableKeys);

    // Создаем таймаут если указан
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      if (requestTimeout) {
        timeoutId = window.setTimeout(() => {
          reject(new Error(`Превышено время ожидания запроса (${requestTimeout}мс)`));
        }, requestTimeout);
      }
    });

    try {
      // Выполняем запрос с таймаутом
      const fetchPromise = fetchFn(url.toString(), {
        method,
        headers,
        body: serializedBody,
        signal,
        credentials,
      });

      // Используем Promise.race для обработки таймаута
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // Обрабатываем ответ
      const { data, error, fileMetadata } = await getResponseData<T, E>(response, responseFormat as ResponseFormat);

      // Формируем результат запроса
      const result: QueryResult<T, E> = {
        data,
        error,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        metadata: {
          requestHeaders: headerObj,
          cacheableHeaders,
          fileMetadata,
          cacheableHeaderKeys: effectiveCacheableKeys,
        },
      };

      return result;
    } catch (err) {
      // Обрабатываем ошибки сети или таймаута
      const error = err as Error;
      console.error('[API] Ошибка выполнения запроса', error);

      // Формируем результат с ошибкой
      return {
        error: error as E,
        ok: false,
        status: 0,
        statusText: error.message,
        headers: new Headers(),
        metadata: {
          requestHeaders: headerObj,
          cacheableHeaders,
        },
      };
    } finally {
      // Очищаем таймер в любом случае
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
  };
}
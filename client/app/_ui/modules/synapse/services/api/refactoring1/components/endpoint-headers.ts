import { ApiContext } from '../types/api1.interface'

/**
 * Тип функции для подготовки заголовков запроса
 */
export type PrepareHeadersFunction = (
  headers: Headers,
  context: ApiContext<any>
) => Promise<Headers>

/**
 * Создает комбинированную функцию для подготовки заголовков, объединяющую
 * глобальные заголовки и заголовки эндпоинта
 *
 * @param globalPrepareHeaders - функция подготовки заголовков на глобальном уровне
 * @param endpointPrepareHeaders - функция подготовки заголовков на уровне эндпоинта
 * @returns - функция для подготовки заголовков
 */
export function createPrepareHeaders(
  globalPrepareHeaders?: PrepareHeadersFunction,
  endpointPrepareHeaders?: PrepareHeadersFunction,
): PrepareHeadersFunction {
  return async (headers: Headers, context: ApiContext<any>): Promise<Headers> => {
    let processedHeaders = new Headers(headers)

    // Применяем глобальную функцию подготовки заголовков, если она определена
    if (globalPrepareHeaders) {
      try {
        processedHeaders = await Promise.resolve(globalPrepareHeaders(processedHeaders, context))
      } catch (error) {
        console.warn('[API] Ошибка при подготовке глобальных заголовков', error)
      }
    }

    // Применяем функцию подготовки заголовков эндпоинта, если она определена
    if (endpointPrepareHeaders) {
      try {
        processedHeaders = await Promise.resolve(endpointPrepareHeaders(processedHeaders, context))
      } catch (error) {
        console.warn('[API] Ошибка при подготовке заголовков эндпоинта', error)
      }
    }

    return processedHeaders
  }
}

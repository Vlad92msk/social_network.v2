import { setImmutable } from '@utils'
import { get, isEqual, uniqWith } from 'lodash'
import { IStorage } from 'synapse-storage/core'
import { ActionDefinition, DispatchFunction } from 'synapse-storage/reactive'

import { DefaultError, ReceivedResponse } from '../../models/apiStatus.ts'
import { apiRequestStore } from './apiRequest.store-util'

/**
 * Тип для ActionCreatorFactory (извлекаем из документации)
 */
type ActionCreatorFactory = <TParams, TResult>(config: ActionDefinition<TParams, TResult>, executionOptions?: any) => DispatchFunction<TParams, TResult>

/**
 * Опции для createApiActions
 */
interface CreateApiActionsOptions<State extends Record<string, any>, RequestParams extends Record<string, any>, SuccessResponse, TransformedResponse = SuccessResponse> {
  /** Дополнительная логика для init action */
  init?: {
    transform?: (params: RequestParams) => RequestParams | Promise<RequestParams>
    meta?: Record<string, any>
  }
  /** Дополнительная логика для request action */
  request?: {
    beforeStore?: (storage: IStorage<State>, responseData: ReceivedResponse<RequestParams, any, any>) => void | Promise<void>
    afterStore?: (storage: IStorage<State>, responseData: ReceivedResponse<RequestParams, any, any>) => void | Promise<void>
    meta?: Record<string, any>
  }
  /** Дополнительная логика для success action */
  success?: {
    beforeStore?: (storage: IStorage<State>, responseData: ReceivedResponse<RequestParams, SuccessResponse, any>) => void | Promise<void>
    afterStore?: (storage: IStorage<State>, responseData: ReceivedResponse<RequestParams, TransformedResponse, any>) => void | Promise<void>
    /** Дополнительная обработка данных */
    transform?: (data: SuccessResponse) => TransformedResponse | Promise<TransformedResponse>
    /** Опции для объединения данных */
    options?: {
      isConcat?: boolean
      compare?: (a: TransformedResponse, b: TransformedResponse) => boolean
    }
    meta?: Record<string, any>
  }
  /** Дополнительная логика для failure action */
  failure?: {
    beforeStore?: (storage: IStorage<State>, responseData: ReceivedResponse<RequestParams, any, DefaultError>) => void | Promise<void>
    afterStore?: (storage: IStorage<State>, responseData: ReceivedResponse<RequestParams, any, DefaultError>) => void | Promise<void>
    meta?: Record<string, any>
  }
  /** Дополнительная логика для reset action */
  reset?: {
    customReset?: (storage: IStorage<State>, apiKey: string) => void | Promise<void>
    meta?: Record<string, any>
  }
}

/**
 * Результат createApiActions
 */
interface ApiActions<RequestParams extends Record<string, any>, SuccessResponse, TransformedResponse = SuccessResponse> {
  init: DispatchFunction<RequestParams, RequestParams>
  request: DispatchFunction<ReceivedResponse<RequestParams, any, any>, ReceivedResponse<RequestParams, any, any>>
  success: DispatchFunction<ReceivedResponse<RequestParams, SuccessResponse, any>, ReceivedResponse<RequestParams, TransformedResponse, any>>
  failure: DispatchFunction<ReceivedResponse<RequestParams, any, DefaultError>, ReceivedResponse<RequestParams, any, DefaultError>>
  reset: DispatchFunction<void, void>
}

/**
 * Создает набор стандартных API действий
 *
 * @param storage - Хранилище состояния
 * @param createAction - Фабрика создания действий
 * @param apiKey - Ключ API в состоянии (должен существовать в state.api)
 * @param options - Дополнительные опции для кастомизации поведения
 */
export function createApiActions<State extends { api: Record<string, any> }, RequestParams extends Record<string, any>, SuccessResponse, TransformedResponse = SuccessResponse>(
  storage: IStorage<State>,
  createAction: ActionCreatorFactory,
  apiKey: keyof State['api'] & string,
  options: CreateApiActionsOptions<State, RequestParams, SuccessResponse, TransformedResponse> = {},
): ApiActions<RequestParams, SuccessResponse, TransformedResponse> {
  const { init, request, success, failure, reset } = options

  return {
    // Инициализация запроса (обычно передача параметров)
    init: createAction<RequestParams, RequestParams>({
      type: `${apiKey}Init`,
      action: async (params) => {
        if (init?.transform) {
          return await init.transform(params)
        }
        return params
      },
      meta: init?.meta,
    }),

    // Обработка начала запроса
    request: createAction<ReceivedResponse<RequestParams, any, any>, ReceivedResponse<RequestParams, any, any>>({
      type: `${apiKey}Request`,
      action: async (responseData) => {
        if (request?.beforeStore) {
          await request.beforeStore(storage, responseData)
        }

        await apiRequestStore(storage, responseData, apiKey, 'request')

        if (request?.afterStore) {
          await request.afterStore(storage, responseData)
        }

        return responseData
      },
      meta: request?.meta,
    }),

    // Обработка успешного ответа
    success: createAction<ReceivedResponse<RequestParams, SuccessResponse, any>, ReceivedResponse<RequestParams, TransformedResponse, any>>({
      type: `${apiKey}Success`,
      action: async (responseData) => {
        if (success?.beforeStore) {
          await success.beforeStore(storage, responseData)
        }

        // Трансформация данных если нужно
        let transformedData: TransformedResponse = responseData.data as TransformedResponse
        if (success?.transform && responseData.data) {
          transformedData = await success.transform(responseData.data)
        }

        // Создаем финальный объект ответа
        const finalResponseData: ReceivedResponse<RequestParams, TransformedResponse, any> = {
          ...responseData,
          data: transformedData,
        }

        // Обработка конкатенации данных
        if (success?.options?.isConcat && Array.isArray(transformedData)) {
          await storage.update((state) => {
            const currentData = get(state, `api.${apiKey}.apiData`, [])
            const mergedData = uniqWith([...currentData, ...(transformedData as any[])], success.options?.compare || isEqual)

            // Обновляем состояние с помощью setImmutable
            const newState = setImmutable(state, `api.${apiKey}`, {
              ...get(state, `api.${apiKey}`, {}),
              apiStatus: 'success',
              isLoading: false,
              apiData: mergedData,
              headers: responseData.headers,
            })

            Object.assign(state, newState)
          })
        } else {
          // Стандартное сохранение без конкатенации
          // @ts-ignore
          await apiRequestStore(storage, finalResponseData, apiKey, 'success')
        }

        if (success?.afterStore) {
          await success.afterStore(storage, finalResponseData)
        }

        return finalResponseData
      },
      meta: success?.meta,
    }),

    // Обработка ошибки
    failure: createAction<ReceivedResponse<RequestParams, any, DefaultError>, ReceivedResponse<RequestParams, any, DefaultError>>({
      type: `${apiKey}Failure`,
      action: async (responseData) => {
        if (failure?.beforeStore) {
          await failure.beforeStore(storage, responseData)
        }

        await apiRequestStore(storage, responseData, apiKey, 'failure')

        if (failure?.afterStore) {
          await failure.afterStore(storage, responseData)
        }

        return responseData
      },
      meta: failure?.meta,
    }),

    // Сброс состояния API
    reset: createAction<void, void>({
      type: `${apiKey}Reset`,
      action: async () => {
        if (reset?.customReset) {
          await reset.customReset(storage, apiKey)
        } else {
          // Стандартная логика сброса
          await storage.update((state) => {
            if (state.api && state.api[apiKey]) {
              state.api[apiKey].isLoading = false
              state.api[apiKey].apiStatus = 'idle'
              state.api[apiKey].apiError = undefined
              state.api[apiKey].apiData = undefined
            }
          })
        }
      },
      meta: reset?.meta,
    }),
  }
}

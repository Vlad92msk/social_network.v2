import { isFormData } from '@utils'
import { IStorage } from 'synapse-storage/core'

import { DefaultError, ReceivedResponse } from '../../models/apiStatus'

export const apiRequestStore = async <
  Storage extends Record<string, any>,
  Segment extends Record<string, any>,
  RequestParams extends Record<string, any>,
  Err extends DefaultError | Error = Error,
>(
  storage: IStorage<Storage>,
  responseData: ReceivedResponse<RequestParams, Segment, Err>,
  key: keyof Storage['api'],
  requestType: 'request' | 'success' | 'failure',
) => {
  await storage.update((state) => {
    switch (requestType) {
      case 'request':
        state.api[key].apiStatus = responseData.status
        state.api[key].isLoading = true

        // Т.к FormData нельзя копировать - очищаем requestParams от данных этого типа
        const requestParamsCleanWithoutFormData = Object.entries(responseData.requestParams).reduce(
          (acc, [key, value]) => {
            if (isFormData(value)) {
              acc[key] = '[FormData]'
            } else {
              acc[key] = value
            }
            return acc
          },
          {} as Record<string, any>,
        )

        state.api[key].requestParams = requestParamsCleanWithoutFormData
        break
      case 'success':
        state.api[key].apiStatus = responseData.status
        state.api[key].isLoading = false
        state.api[key].apiData = responseData.data
        // state.api[key].headers = responseData.headers
        break
      case 'failure':
        state.api[key].apiStatus = responseData.status
        state.api[key].isLoading = false
        state.api[key].apiError = responseData.error
        // state.api[key].headers = responseData.headers
        break
      default:
        break
    }
  })
}

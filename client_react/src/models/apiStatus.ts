/**
 * TODO: экспортировать потом из библиотеки
 */
export interface ReceivedResponse<RequestParams extends Record<string, any> = any, ResponseData = any, E = Error> {
  status: 'loading' | 'success' | 'error' | 'idle'
  data?: ResponseData
  error?: E
  headers: Record<string, any> | Headers
  requestParams: RequestParams
  fromCache: boolean
}
type ApiStatus = ReceivedResponse['status']
type ApiError = ReceivedResponse['error']
type ApiHeaders = ReceivedResponse['headers']
type ApiRequestParams<RequestParams extends Record<string, any>, Response> = ReceivedResponse<RequestParams, Response>['requestParams']

export enum ApiStatusPendingEnum {
  IDL = 'idle',
  LOADING = 'loading',
  LOAD = 'success',
  ERROR = 'error',
}

export type DefaultError = {
  code?: number
  message?: string
  description?: string
  error_text?: string
}

/**
 * Как локально храним пагинацию
 */
export interface RequestPagination {
  page?: number
  per_page?: number
  pages?: number
}

/**
 * @param RequestParams - Тип параметров заапроса
 * @param ResponseData - Тип apiData
 * @param E - Тип ошибки
 */
export interface ApiStatusState<RequestParams extends Record<string, any> = Record<string, any>, ResponseData = unknown, E = DefaultError | Error> {
  apiData?: ResponseData
  apiStatus: ApiStatus
  apiError?: E
  headers?: ApiHeaders & RequestPagination
  isLoading?: boolean
  requestParams?: ApiRequestParams<RequestParams, ResponseData>
}

export const initialApiState: ApiStatusState<any, any> = {
  apiData: undefined,
  apiStatus: ApiStatusPendingEnum.IDL,
  apiError: undefined,
  headers: undefined,
  isLoading: undefined,
  requestParams: undefined,
}

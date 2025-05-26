/**
 * TODO: экспортировать потом из библиотеки
 */
export interface ReceivedResponse<ResponseData = any, RequestParams extends Record<string, any> = any, E = Error> {
  status: 'loading' | 'success' | 'error' | 'idle'
  data?: ResponseData
  error?: E
  headers: Record<string, any> | Headers
  requestParams: RequestParams
  fromCache: boolean
}
type ApiStatus = ReceivedResponse['status'];
type ApiError = ReceivedResponse['error'];
type ApiHeaders = ReceivedResponse['headers'];
type ApiRequestParams<Response, RequestParams extends Record<string, any>> = ReceivedResponse<Response, RequestParams>['requestParams'];

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
};

/**
 * Как локально храним пагинацию
 */
export interface RequestPagination {
  page?: number
  per_page?: number
  pages?: number
}

/**
 * @param T - Тип apiData
 * @param E - Тип ошибки
 */
export interface ApiStatusState<T, ReqestParams extends Record<string, any> = Record<string, any>, E = DefaultError | Error> {
  apiData?: T
  apiStatus: ApiStatus
  apiError?: E
  headers?: ApiHeaders & RequestPagination
  isLoading?: boolean
  requestParams?: ApiRequestParams<T, ReqestParams>
}

export const initialApiState: ApiStatusState<unknown> = {
  apiData: undefined,
  apiStatus: ApiStatusPendingEnum.IDL,
  apiError: undefined,
  headers: undefined,
  isLoading: undefined,
  requestParams: undefined,
}

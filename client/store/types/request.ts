import { ActionCreatorWithOptionalPayload, PayloadAction } from '@reduxjs/toolkit'

export enum ApiStatusPendingEnum {
  LOADING = 'LOADING',
  LOAD = 'LOAD',
  ERROR = 'ERROR',
}

export type DefaultError = {
  code?: number;
  message?: string;
  description?: string;
  error_text?: string;
};

export interface ApiStatusError<T = DefaultError> {
  error: T;
}

/**
 * Как локально храним пагинацию
 */
export interface RequestPagination {
  page?: number;
  per_page?: number;
  pages?: number;
}

/**
 * Если будем расширять параметры заголовков
 */
export type RequestHeaders = Record<string, any>;

/**
 * @param T - Тип apiData
 * @param E - Тип ошибки (apiStatus -> error)
 */
export interface ApiStatusState<T, E = DefaultError> {
  apiData: T | undefined;
  apiStatus: ApiStatusPendingEnum | undefined;
  apiError: ApiStatusError<E> | undefined;
  headers?: RequestHeaders & RequestPagination;
}

export const initialApiState: ApiStatusState<null> = {
  apiData: undefined,
  apiStatus: undefined,
  apiError: undefined,
  headers: undefined,
}

export interface PayloadApiError {
  error: DefaultError;
}

export type PayloadApiSuccess<T = any> = {
  data: T;
  headers?: Record<string, any>;
};

export type PayloadRequest<P = any> = PayloadAction<PayloadApiSuccess<P>>;
export type PayloadFailure = PayloadAction<PayloadApiError>;

export type PA<P = void> = PayloadAction<P>;
export type PR<P = any> = PayloadRequest<P>;
export type PF = PayloadFailure;

export type ActionCreator<P = any> = ActionCreatorWithOptionalPayload<P>;

export type ExtractApiData<T> = {
  [P in keyof T]: T[P] extends ApiStatusState<Record<string, any>> ? T[P]['apiData'] : unknown;
};


export interface PaginationInfo {
  total: number
  pages: number
  page: number
  per_page: number
}

export interface PaginationResponse<Data> {
  data: Data
  paginationInfo: PaginationInfo
}

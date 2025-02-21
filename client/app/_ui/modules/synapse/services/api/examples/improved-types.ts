// improved-types.ts
import { ApiClient } from '../components/api-client'
import { Endpoint, TypedEndpointConfig } from '../types/api.interface'

/**
 * Извлекает тип API клиента из функции создания
 */
export type ApiClientType<T extends (...args: any[]) => ApiClient<any>> =
  ReturnType<T>;

/**
 * Извлекает тип эндпоинтов из API клиента
 */
export type EndpointsType<T extends ApiClient<any>> =
  T extends ApiClient<infer E> ? E : never;

/**
 * Извлекает типы из TypedEndpointConfig и сопоставляет с Endpoint
 */
export type TypedEndpoints<T extends Record<string, TypedEndpointConfig<any, any>>> = {
  [K in keyof T]: Endpoint<Parameters<T[K]['request']>[0], T[K]['response']>;
};

/**
 * Тип для безопасного получения эндпоинтов с сохранением типизации
 */
export interface TypedApiClient<T extends Record<string, TypedEndpointConfig<any, any>>>
  extends ApiClient<T> {
  typedEndpoints: TypedEndpoints<T>;
}


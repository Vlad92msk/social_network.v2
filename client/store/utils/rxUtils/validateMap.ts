import { Action } from 'redux'
import { Observable, of, OperatorFunction, pipe } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { ActionCreator } from './ofType'
import { makeStore } from '../../store'
import { ChunkRequestConsistent, chunkRequestConsistent, ChunkRequestParallel, chunkRequestParallel } from '../other'

export interface ValidateConfig {
  skipAction:
    | (Action | ActionCreator<any> | ReturnType<ActionCreator>)
    | (Action | ActionCreator<any> | ReturnType<ActionCreator>)[];
  conditions: boolean[];
}

interface ValidateMapRequestUtils {
  chunkRequest?: ChunkRequestParallel;
  chunkRequestConsistent?: ChunkRequestConsistent;
}

/**
 * Параметры которые нужно передать в метод
 */
interface ApiCallAllPropsRequestProps {
  format?: any;
  baseUrl?: string;
}

export interface ApiCallAllProps {
  requestParams: ApiCallAllPropsRequestProps;
  authOptions: {};
}

/**
 * Формируем данные которые могут понадобиться в запросах
 * авторизационные, системные и т.д
 */
export function getRequestVariables<T>(): OperatorFunction<T, { pipeData: T; mainData: ApiCallAllProps }> {
  return pipe(
    map((pipeData) => {
      const store = makeStore()

      const state = store.getState()

      const mainData = {
        /**
         * Параметры которые нужно передать в метод
         */
        requestParams: {},
        /**
         * Авторизационные/системные параметры которые могут понадобиться в запросах
         */
        authOptions: {},
      }
      return { pipeData, mainData }
    }),
  )
}

/**
 * Утилита для управления запросом
 * Может валидировать данные перед отправкой
 * @param validator - функция принимающая экшн сброса и boolean[]
 * @param apiCall - экшн успеха
 */
export function validateMap<T>({
  validator,
  apiCall,
}: {
  validator?: (value: T, mainData?: ApiCallAllProps) => ValidateConfig;
  apiCall: (value: T, allProps: ApiCallAllProps, utils: ValidateMapRequestUtils) => Observable<any>;
}): OperatorFunction<T, any> {
  return pipe(
    getRequestVariables(),
    switchMap(({ pipeData, mainData }) => {
      const { requestParams, authOptions } = mainData

      /**
       * Функция вызова API-метода
       */
      const callApi = () => apiCall(
        pipeData,
        { requestParams, authOptions },
        {
          chunkRequest: chunkRequestParallel,
          chunkRequestConsistent,
        },
      )

      /**
       * Если валидацию не используем - сразу вызвваем запрос
       */
      if (!validator) return callApi()

      const validateConfig = validator(pipeData, mainData)
      const { conditions, skipAction } = validateConfig
      const conditionMet = conditions.every(Boolean)

      /**
       * Если валидация не пройдена - вызываем экшн сброса
       */
      if (!conditionMet) {
        if (Array.isArray(skipAction)) {
          return of(...skipAction?.filter(Boolean).map((action) => (typeof action === 'function' ? action() : action)))
        }
        return of(typeof skipAction === 'function' ? skipAction() : skipAction)
      }

      return callApi()
    }),
  )
}

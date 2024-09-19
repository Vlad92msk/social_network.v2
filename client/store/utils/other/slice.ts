import { CaseReducer, createSlice, Draft, Slice, SliceCaseReducers } from '@reduxjs/toolkit'
import { PayloadAction } from '@reduxjs/toolkit/src/createAction'
import { assign, get, isArray, isObject, merge, omit } from 'lodash'
import { setImmutable } from '@utils/others'
import { ApiStatusPendingEnum, initialApiState, PA, PF, PR } from '../../types/request'

export function request<S, P>(
  key?: keyof S | string,
  addAction?: CaseReducer<S, PA<P>>,
  defaultProps?: P,
): CaseReducer<S, PA<P>> {
  return (state, action) => {
    if (!key) return addAction?.(state, action) || state

    if (!Boolean(action.payload) && Boolean(defaultProps)) {
      action.payload = defaultProps as P
    }

    const changesState = { ...initialApiState, apiStatus: ApiStatusPendingEnum.LOADING }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const newSate = setImmutable(state, String(key), changesState) as Draft<S>
    return addAction?.(newSate, action) || newSate
  }
}

interface RequestSuccessOptions {
  isConcat?: boolean;
}

export function requestSuccess<S, P>(
  key?: keyof S | string,
  addAction?: CaseReducer<S, PR<P>>,
  options?: {
    isConcat?: boolean;
  },
): CaseReducer<S, PR<P>> {
  return (state, action) => {
    if (!key) return addAction?.(state, action) || state

    const { payload } = action
    const changesState = {
      ...initialApiState,
      apiStatus: ApiStatusPendingEnum.LOAD,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      // eslint-disable-next-line no-unsafe-optional-chaining
      apiData: options?.isConcat ? [...get(state, `${key}.apiData`, []), ...payload?.data] : payload?.data,
      headers: payload?.headers,
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const newSate = setImmutable(state, String(key), changesState) as Draft<S>
    return addAction?.(newSate, action) || newSate
  }
}

export function requestFailure<S>(key?: keyof S | string, addAction?: CaseReducer<S, PF>): CaseReducer<S, PF> {
  return (state, action) => {
    if (!key) return addAction?.(state, action) || state

    const { payload } = action
    const changesState = { ...initialApiState, apiStatus: ApiStatusPendingEnum.ERROR, apiError: payload.error }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const newSate = setImmutable(state, String(key), changesState) as Draft<S>
    return addAction?.(newSate, action) || newSate
  }
}

export function setState<S, P>(
  key: keyof S | string,
  addAction?: CaseReducer<S, PayloadAction<P>>,
): CaseReducer<S, PayloadAction<P>> {
  return (state, action) => {
    const { payload } = action
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const newState = setImmutable(state, String(key), payload) as Draft<S>
    return addAction?.(newState, action) || newState
  }
}

/**
 * Функция для редактирования произвольного объекта
 * в качестве payload принимает не объект/примитив как обычные экшены
 * а функцию
 * где первый аргумент - объект из Стора который редактируется
 * где второй аргумент - весь Стор
 */
function setStateAnyObject<S, ChangeObj>(
  key: keyof S | string,
): CaseReducer<S, PayloadAction<ChangeObj>> {
  return (state, action) => {
    const { payload } = action
    const currentValue = get(state, key)
    const newState = typeof payload === 'function' ? payload(currentValue, state) : payload
    // @ts-ignore
    return setImmutable(state, String(key), newState || currentValue) as Draft<S>
  }
}

export type FiltersPayloadType = 'set' | 'add' | 'remove' | 'reset' | undefined;
export type FiltersPayload = {
  name?: string;
  value?: unknown;
  type?: FiltersPayloadType;
};

/**
 * Функция позволяющая работать с фильтрами
 */
function setFilters<S extends Record<string, any>, P extends FiltersPayload>(
  key: keyof S,
  initialState: unknown,
): CaseReducer<S, PayloadAction<P>> {
  return (state, action) => {
    const {
      payload: { value, type, name },
    } = action
    const prev = get(state, key)
    const propPath = `${String(key)}.${name}`
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const currentProp = prev[name]

    const isArr = isArray(currentProp)
    const isObj = isObject(currentProp)

    switch (type) {
      case 'set':
        return setImmutable(state, propPath, value)
      case 'add':
        return setImmutable(
          state,
          propPath,
          isArr ? currentProp.push(value) : isObj ? assign(currentProp, value) : value,
        )
      case 'remove':
        return setImmutable(
          state,
          propPath,
          isArr
            ? currentProp.filter((filterId) => filterId !== value)
            : isObj
              ? omit(currentProp, String(value))
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              : initialState[name],
        )
      case 'reset':
        return setImmutable(state, String(key), initialState)
      default:
        return state
    }
  }
}

export function requestReset<S>(key: keyof S | string): CaseReducer<S> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return (state) => setImmutable(state, String(key), initialApiState)
}

/**
 * Экшен который всегда нужно вызывать при МОНТИРОВАНИИ основного модуля
 * Позволяет положить в Стору первоначальные данные
 */
function moduleEnter<S>(
  addAction?: CaseReducer<S, PA<Partial<Omit<S, 'apis'>>>>,
): CaseReducer<S, PA<Partial<Omit<S, 'apis'>>>> {
  return (state, action) => {
    const { payload } = action

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { apis } = state
    const pick = {}

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    Object.entries(state).forEach(([a, b]) => {
      if (a !== 'apis') {
        pick[a] = b
      }
    })

    const allProps = merge({}, pick, payload)

    const newSate = {
      apis,
      ...allProps,
    } as Draft<S>

    return addAction?.(newSate, action) || newSate
  }
}
/**
 * Экшен который всегда нужно вызывать при РАЗМОНТИРОВАНИИ основного модуля
 * Сбрасывает данные в Сторе на initialModuleState
 */
export function moduleExit<S>(initialModuleState: S) {
  return () => initialModuleState
}

/**
 * Универсальная функция для создания Экшенов для метода
 */
function createApiActions<State, RequestParams, SuccessResponse>(
  apiPath?: string,
  options?: {
    success?: {
      callback?: CaseReducer<State, PR<SuccessResponse>>;
      options?: RequestSuccessOptions;
    };
    request?: {
      callback?: CaseReducer<State, PA<RequestParams>>;
      defaultProps?: RequestParams;
    };
    failure?: {
      callback?: CaseReducer<State, PF>;
    };
  },
) {
  return {
    request: request<State, RequestParams>(apiPath, options?.request?.callback, options?.request?.defaultProps),
    success: requestSuccess<State, SuccessResponse>(apiPath, options?.success?.callback, options?.success?.options),
    failure: requestFailure<State>(apiPath, options?.failure?.callback),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    reset: requestReset<State>(apiPath),
  }
}

/**
 * Все утилиты, необходимые для создания Слайса
 */
type SliceBuilderCallbackArgs = {
  createApiActions: typeof createApiActions;
  moduleEnter: typeof moduleEnter;
  moduleExit: typeof moduleExit;
  request: typeof request;
  createSlice: typeof createSlice;
  setState: typeof setState;
  setFilters: typeof setFilters;
  setStateAnyObject: typeof setStateAnyObject;
  requestFailure: typeof requestFailure;
};

// Определим тип для функции колбэка
type SliceBuilderCallback<S, Reducers extends SliceCaseReducers<S>> = (
  utils: SliceBuilderCallbackArgs,
) => Slice<S, Reducers>;

/**
 * Функция по созданию Слайса
 * Передает в нее все утилиты, необходимые для создания Слайса
 */
export const sliceBuilder = <S, Reducers extends SliceCaseReducers<S>>(fn: SliceBuilderCallback<S, Reducers>) => fn({
  createApiActions,
  moduleEnter,
  moduleExit,
  request,
  createSlice,
  setState,
  setFilters,
  setStateAnyObject,
  requestFailure,
})

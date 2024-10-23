import { CaseReducer, createSlice, Draft, Slice, SliceCaseReducers } from '@reduxjs/toolkit'
import { PayloadAction } from '@reduxjs/toolkit/src/createAction'
import { assign, get, isArray, isObject, omit } from 'lodash'
import { setImmutable } from '@utils/others'

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

/**
 * Все утилиты, необходимые для создания Слайса
 */
type SliceBuilderCallbackArgs = {
  createSlice: typeof createSlice;
  setState: typeof setState;
  setFilters: typeof setFilters;
  setStateAnyObject: typeof setStateAnyObject;
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
  createSlice,
  setState,
  setFilters,
  setStateAnyObject,
})

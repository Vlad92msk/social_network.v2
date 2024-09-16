import { OperatorFunction } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'
import { StoreObservable } from '../../root.effects'
import { RootReducer } from '../../root.reducer'

/**
 * @description Запускает переданные селекторы возвращая массив значений в порядке переданных селекторов (принцип как в useSelector)
 * @param {StoreObservable} store$
 * @param selectors - Селекторы в которые будут передаваться store
 */
type Sel<T> = (state: RootReducer) => T;
type SO = StoreObservable;
export function selectorMap<A, T1>(s: SO, a: Sel<T1>): OperatorFunction<A, [A, [T1]]>;
export function selectorMap<A, T1, T2>(s: SO, a: Sel<T1>, b: Sel<T2>): OperatorFunction<A, [A, [T1, T2]]>;
export function selectorMap<A, T1, T2, T3>(
  s: SO,
  a: Sel<T1>,
  b: Sel<T2>,
  c: Sel<T3>,
): OperatorFunction<A, [A, [T1, T2, T3]]>;
export function selectorMap<A, T1, T2, T3, T4>(
  s: SO,
  a: Sel<T1>,
  b: Sel<T2>,
  c: Sel<T3>,
  d: Sel<T4>,
): OperatorFunction<A, [A, [T1, T2, T3, T4]]>;
export function selectorMap<A, T1, T2, T3, T4, T5>(
  s: SO,
  a: Sel<T1>,
  b: Sel<T2>,
  c: Sel<T3>,
  d: Sel<T4>,
  e: Sel<T5>,
): OperatorFunction<A, [A, [T1, T2, T3, T4, T5]]>;
export function selectorMap<A, T1, T2, T3, T4, T5, T6>(
  s: SO,
  a: Sel<T1>,
  b: Sel<T2>,
  c: Sel<T3>,
  d: Sel<T4>,
  e: Sel<T5>,
  f: Sel<T6>,
): OperatorFunction<A, [A, [T1, T2, T3, T4, T5, T6]]>;
export function selectorMap<A, T1, T2, T3, T4, T5, T6, T7>(
  s: SO,
  a: Sel<T1>,
  b: Sel<T2>,
  c: Sel<T3>,
  d: Sel<T4>,
  e: Sel<T5>,
  f: Sel<T6>,
  g: Sel<T7>,
): OperatorFunction<A, [A, [T1, T2, T3, T4, T5, T6, T7]]>;
export function selectorMap<A, T1, T2, T3, T4, T5, T6, T7, T8>(
  s: SO,
  a: Sel<T1>,
  b: Sel<T2>,
  c: Sel<T3>,
  d: Sel<T4>,
  e: Sel<T5>,
  f: Sel<T6>,
  g: Sel<T7>,
  h: Sel<T8>,
): OperatorFunction<A, [A, [T1, T2, T3, T4, T5, T6, T7, T8]]>;
export function selectorMap<A, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  s: SO,
  a: Sel<T1>,
  b: Sel<T2>,
  c: Sel<T3>,
  d: Sel<T4>,
  e: Sel<T5>,
  f: Sel<T6>,
  g: Sel<T7>,
  h: Sel<T8>,
  i: Sel<T9>,
): OperatorFunction<A, [A, [T1, T2, T3, T4, T5, T6, T7, T8, T9]]>;
export function selectorMap<A, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  s: SO,
  a: Sel<T1>,
  b: Sel<T2>,
  c: Sel<T3>,
  d: Sel<T4>,
  e: Sel<T5>,
  f: Sel<T6>,
  g: Sel<T7>,
  h: Sel<T8>,
  i: Sel<T9>,
  j: Sel<T10>,
): OperatorFunction<A, [A, [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]]>;
export function selectorMap<A, T>(store$: StoreObservable, ...selectors: Sel<T>[]): OperatorFunction<A, [A, T[]]>;
export function selectorMap<A, T>(store$: StoreObservable, ...selectors: Sel<T>[]): OperatorFunction<A, [A, T[]]> {
  return withLatestFrom(store$.pipe(map((store) => selectors.map((selector) => selector(store)))))
}

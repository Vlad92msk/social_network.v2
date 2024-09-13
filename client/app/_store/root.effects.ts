import { Action } from 'redux'
import { combineEpics, StateObservable } from 'redux-observable'
import { Observable } from 'rxjs'
import { RootReducer } from './root.reducer'
import { ApiServiceType } from './store'
import { tagsEffects } from './tag.effect'

export declare type StoreObservable = StateObservable<RootReducer>

export declare type Effect = (
    action$: Observable<Action>,
    store$: StoreObservable,
    api: ApiServiceType,
) => Observable<Action>;

/**
 * Модель данных возвращаемых при успешном ответе
 */
export interface ResponseApiService<T = any> {
    data: T;
    headers: Headers;
}

export const rootEffect = combineEpics(
  tagsEffects,
)

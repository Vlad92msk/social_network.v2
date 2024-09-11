import { Action } from 'redux';
import { Observable } from 'rxjs';
import { StateObservable } from 'redux-observable';
import { ApiServiceType } from './store';
import { RootState } from './store';
import { combineEpics, Epic } from 'redux-observable';
import { tagsEffects } from "./tag.effect";

export declare type StoreObservable = StateObservable<RootState>

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
    tagsEffects
);

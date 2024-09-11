import { Action } from 'redux';
import { Observable } from 'rxjs';
import { StateObservable } from 'redux-observable';
import { ApiService, ApiServiceType } from './store';
import { RootState } from './store';
import { combineEpics, Epic } from 'redux-observable';
import { tagsEffects } from "./tag.effect";

export type StoreObservable = StateObservable<RootState>;

export type Effect = (
    action$: Observable<Action>,
    store$: StoreObservable,
    api: ApiServiceType,
) => Observable<Action>;


// Здесь вы можете импортировать и комбинировать все ваши эффекты
export const rootEffect = combineEpics(
    tagsEffects
);

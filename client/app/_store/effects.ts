import { Action } from 'redux';
import { Observable } from 'rxjs';
import { StateObservable } from 'redux-observable';
import { ApiService } from './store';
import { RootState } from './store';
import { combineEpics as combineEffects, Epic } from 'redux-observable';

export type StoreObservable = StateObservable<RootState>;

export type Effect = (
    action$: Observable<Action>,
    store$: StoreObservable,
    api: ApiService,
) => Observable<Action>;

// Здесь вы можете импортировать и комбинировать все ваши эффекты
export const rootEffect = combineEffects(
    // messagesEffects,
    // usersEffects,
    // tagsEffects,
);

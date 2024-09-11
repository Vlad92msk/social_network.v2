import { combineEpics, Epic, ofType } from 'redux-observable';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Effect } from './effects';

const exampleEpic: Effect = (action$, state$, { tags }) => action$.pipe(
    ofType('SOME_ACTION'),
    switchMap(action =>
// @ts-ignore
        tags.findTagsObservable({entity_type: 1}).pipe(
            map(response => ({ type: 'SOME_SUCCESS_ACTION', payload: response.data })),
            catchError(error => {
                console.log('__eeee____', error.data)
                return of({type: 'SOME_ERROR_ACTION', payload: error});
            })
        )
    )
);


export const tagsEffects = combineEpics(
    exampleEpic,
);

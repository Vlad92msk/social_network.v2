import { error } from 'next/dist/build/output/log'
import { combineEpics, Epic, ofType } from 'redux-observable'
import { of } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'
import { Effect } from './root.effects'
import { ofTypeEffect, resultMap, validateMap } from './utils/rxUtils'

const exampleEpic1: Effect = (action$, state$, { tags }) => action$.pipe(
  ofType('SOME_ACTION'),
  switchMap((action) =>
  // @ts-ignore
  //         tags.findTagsObservable({entity_type: 1}).pipe(
    tags.findTagsObservable().pipe(
      map((response) => ({ type: 'SOME_SUCCESS_ACTION', payload: response.data })),
      catchError((error) => {
        console.log('__eeee____', error.data)
        return of({ type: 'SOME_ERROR_ACTION', payload: error })
      }),
    )),
)

const exampleEpic: Effect = (action$, store$, { tags }) =>
  action$.pipe(
// @ts-ignore
    ofTypeEffect('SOME_ACTION'),
    validateMap({
      apiCall: (_, { requestParams }) =>
        tags
          .findTagsObservable(
//@ts-ignore
            {entity_type: 'dwed' },
          )
          .pipe(
            resultMap({
              success: (response) => {
                console.log('response', response)
                return of({
                  type: 'SOME_SUCCESS_ACTION',
                  payload: response
                })
              },
              errors: (er) => {
                console.log('error', er)
                return { type: 'SOME_ERROR_ACTION', payload: er }
              },
            }),
          ),
    }),
  );

export const tagsEffects = combineEpics(
  exampleEpic,
)

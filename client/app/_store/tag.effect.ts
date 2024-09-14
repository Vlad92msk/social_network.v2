import { combineEpics } from 'redux-observable'
import { of } from 'rxjs'
import { Effect } from './root.effects'
import { ofTypeEffect, resultMap, validateMap } from './utils/rxUtils'

const exampleEpic: Effect = (action$, store$, { tags, profile, userInfo }) =>
  action$.pipe(
// @ts-ignore
    ofTypeEffect('SOME_ACTION'),
    validateMap({
      apiCall: (_, { requestParams }) =>
        tags
          .findTagsObservable()
          .pipe(
            resultMap({
              success: (response) => {
                console.log('response', response)
                return of('SOME_SUCCESS_ACTION')
              },
              errors: []
            }),
          ),
    }),
  );

export const tagsEffects = combineEpics(
  exampleEpic,
)

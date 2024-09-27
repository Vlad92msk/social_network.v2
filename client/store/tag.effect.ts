import { combineEpics, ofType } from 'redux-observable'
import { from, of } from 'rxjs'
import { TagsApiApi } from './api'
import { Effect } from './root.effects'
import { resultMap, validateMap } from './utils/rxUtils'

const exampleEpic: Effect = (action$, store$, { tags, profile, userInfo }) => action$.pipe(
  ofType('FETCH_TAGS'),
  validateMap({
    apiCall: (_, { requestParams }) => from(TagsApiApi.findTags({}))
      .pipe(
        resultMap({
          success: (response) => {
            console.log('response', response)
            return of({
              type: 'FETCH_TAGS_SUCCESS',
              payload: response,
            })
          },
          errors: [],
        }),
      ),
  }),
)

export const tagsEffects = combineEpics(
  exampleEpic,
)

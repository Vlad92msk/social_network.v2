import { StorageUtils } from '@utils'
import { from, of } from 'rxjs'
import { distinctUntilChanged, switchMap } from 'rxjs/operators'
import { combineEffects, createEffect, ofType, validateMap } from 'synapse-storage/reactive'

import { CookieType } from '../../../models/cookie.ts'
import { UserProfileApi } from '../../api/profile.api'
import { IDBCore } from '../../types'
import { CoreDispatcher } from './core.dispatcher'

type DispatcherType = {
  coreDispatcher: CoreDispatcher
}
type ApiType = {
  userProfileAPi: UserProfileApi
}

type ExternalStorages = Record<string, any>
type Config = {
  browserStorage: StorageUtils
}

type Effect = ReturnType<typeof createEffect<IDBCore, DispatcherType, ApiType, Config, ExternalStorages>>

const moduleEnter: Effect = createEffect((action$, state$, externalStates, { coreDispatcher }, { userProfileAPi }) =>
  action$.pipe(
    ofType(coreDispatcher.dispatch.moduleEnter),
    distinctUntilChanged(),
    switchMap(({ payload }) =>
      of(
        coreDispatcher.dispatch.getUserProfileInit({
          body: { email: payload.email },
        }),
      ),
    ),
  ),
)

const getProfileInfo: Effect = createEffect((action$, state$, externalStates, { coreDispatcher }, { userProfileAPi }, { browserStorage }) =>
  action$.pipe(
    ofType(coreDispatcher.dispatch.getUserProfileInit),
    validateMap({
      apiCall: (action) =>
        from(
          userProfileAPi.getProfileInfo.request(action.payload).waitWithCallbacks({
            loading: async (request) => {
              await coreDispatcher.dispatch.getUserProfileRequest(request)
            },
            success: async (data, request) => {
              await coreDispatcher.dispatch.getUserProfileSuccess(request)
              // Сохраняем публичный ID в cookie
              browserStorage.setCookie(CookieType.USER_PUBLIC_ID, data!.user_info.public_id, {})
            },
            error: async (error, request) => {
              await coreDispatcher.dispatch.getUserProfileError(error)
            },
          }),
        ),
    }),
  ),
)

export const userProfileEffects = combineEffects(moduleEnter, getProfileInfo)

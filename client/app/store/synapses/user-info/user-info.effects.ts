import { EMPTY, from, withLatestFrom } from 'rxjs'
import { map } from 'rxjs/operators'
import { combineEffects, createEffect, ofType, selectorObject, validateMap } from 'synapse-storage/reactive'
import { UserInfoDispatcher } from './user-info.dispatcher'
import { AboutUserUserInfo } from './user-info.store'
import { UpdateUserDto } from '../../../../../swagger/userInfo/interfaces-userInfo'
import { UserInfoApi } from '../../api/user-info.api'
import { CoreDispatcher } from '../core/core.dispatcher'
import { coreSynapseIDB } from '../core/core.synapse'

type DispatcherType = {
  userInfoDispatcher: UserInfoDispatcher
  coreIdbDispatcher: CoreDispatcher
};
type ApiType = {
  userInfoAPi: UserInfoApi
};

type ExternalStorages = {
  core$: typeof coreSynapseIDB.state$
}

type Effect = ReturnType<typeof createEffect<
  AboutUserUserInfo,
  DispatcherType,
  ApiType,
  Record<string, void>,
  ExternalStorages
>>

const loadUserInfoById: Effect = createEffect(
  (action$, state$, externalStates, { userInfoDispatcher, coreIdbDispatcher }) => action$.pipe(
    // Если изменился профиль прользователя в core - устанавливаем его в текущий synapse
    ofType(coreIdbDispatcher.watchers.watchCurrentUserProfileUserInfo),
    map((action) => {
      if (!action.payload) return EMPTY
      return userInfoDispatcher.dispatch.setCurrentUserProfile(action.payload.user_info)
    }),
  ),
)

const updateUserProfile: Effect = createEffect(
  (action$, state$, externalStates, { userInfoDispatcher, coreIdbDispatcher }, { userInfoAPi }) => action$.pipe(
    ofType(userInfoDispatcher.dispatch.submit),
    withLatestFrom(
      selectorObject(externalStates.core$, {
        currentUserEmail: (s) => s.currentUserProfile?.email,
      }),
    ),
    validateMap({
      apiCall: ([action, { currentUserEmail }]) => from(
        userInfoAPi.updateUser.request({ body: action.payload as UpdateUserDto }).waitWithCallbacks({
          loading: async (request) => {
            await userInfoDispatcher.dispatch.updateUserInfoRequest(request)
          },
          success: async (data, request) => {
            await userInfoDispatcher.dispatch.updateUserInfoSuccess(request)
            // Обновляем инф в core
            await coreIdbDispatcher.dispatch.getUserProfileInit({ body: { email: currentUserEmail! } })
            // Закрываем режим редактирования
            await userInfoDispatcher.dispatch.setActiveChange()
          },
          error: async (error, request) => {
            await userInfoDispatcher.dispatch.updateUserInfoError(request)
            await userInfoDispatcher.dispatch.reset()
          },
        }),
      ),
    }),
  ),
)

export const userInfoEffects = combineEffects(
  loadUserInfoById,
  updateUserProfile,
)

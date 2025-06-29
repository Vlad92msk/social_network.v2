import { EMPTY, from, of, switchMap, withLatestFrom } from 'rxjs'
import { map } from 'rxjs/operators'
import { combineEffects, createEffect, ofType, selectorObject, validateMap } from 'synapse-storage/reactive'

import { UpdateUserDto } from '../../../../../swagger/userInfo/interfaces-userInfo'
import { UserInfoApi } from '../../api/user-info.api'
import { CoreDispatcher } from '../core/core.dispatcher'
import { coreSynapseIDB } from '../core/core.synapse'
import { NotificationsDispatcher } from '../notifications/notifications.dispatcher'
import { UserInfoDispatcher } from './user-info.dispatcher'
import { AboutUserUserInfo } from './user-info.store'

type DispatcherType = {
  userInfoDispatcher: UserInfoDispatcher
  coreIdbDispatcher: CoreDispatcher
  notificationDispatcher: NotificationsDispatcher
}
type ApiType = {
  userInfoAPi: UserInfoApi
}

type ExternalStorages = {
  core$: typeof coreSynapseIDB.state$
}

type Effect = ReturnType<typeof createEffect<AboutUserUserInfo, DispatcherType, ApiType, Record<string, void>, ExternalStorages>>

// Если изменился профиль прользователя в core - устанавливаем его в текущий synapse
const loadUserInfoById: Effect = createEffect((action$, state$, externalStates, { userInfoDispatcher, coreIdbDispatcher }) =>
  action$.pipe(
    ofType(coreIdbDispatcher.watchers.watchCurrentUserProfileUserInfo),
    map((action) => {
      if (!action.payload) return EMPTY
      return userInfoDispatcher.dispatch.setCurrentUserProfile(action.payload.user_info)
    }),
  ),
)

// Запрос на обновление профиля
const updateUserProfile: Effect = createEffect((action$, state$, externalStates, { userInfoDispatcher }, { userInfoAPi }) =>
  action$.pipe(
    ofType(userInfoDispatcher.dispatch.submit),
    validateMap({
      apiCall: (action) =>
        from(
          userInfoAPi.updateUser.request({ body: action.payload as UpdateUserDto }).waitWithCallbacks({
            loading: async (request) => {
              // @ts-ignore
              await userInfoDispatcher.dispatch.updateUserInfoRequest(request)
            },
            success: async (data, request) => {
              await userInfoDispatcher.dispatch.updateUserInfoSuccess(request)
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

// Слушаетель для успешного обновления профиля пользователя
const updateUserProfileWatcher: Effect = createEffect((action$, state$, externalStates, { userInfoDispatcher, coreIdbDispatcher, notificationDispatcher }) =>
  action$.pipe(
    ofType(userInfoDispatcher.dispatch.updateUserInfoSuccess),
    withLatestFrom(
      selectorObject(externalStates.core$, {
        currentUserEmail: (s) => s.api.profileInfo.apiData?.email,
      }),
    ),
    switchMap(([action, { currentUserEmail }]) =>
      of(
        // Обновляем инф в core
        coreIdbDispatcher.dispatch.getUserProfileInit({ body: { email: currentUserEmail! } }),
        // Закрываем режим редактирования
        userInfoDispatcher.dispatch.setActiveChange(),
        // Показываем уведомление
        notificationDispatcher.dispatch.addNotification({ type: 'success', message: 'Профиль успешно обновлен' }),
      ),
    ),
  ),
)

export const userInfoEffects = combineEffects(loadUserInfoById, updateUserProfile, updateUserProfileWatcher)

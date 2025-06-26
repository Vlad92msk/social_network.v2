import { apiRequestStore } from '@store/utils'
import { IStorage } from 'synapse-storage/core'
import { createDispatcher, loggerDispatcherMiddleware } from 'synapse-storage/reactive'
import { GetProfileInfoParams } from '../../../../../swagger/profile/api-client-profile.ts'
import { UserProfileInfo } from '../../../../../swagger/profile/interfaces-profile'
import { UserInfo } from '../../../../../swagger/userInfo/interfaces-userInfo.ts'
import { ReceivedResponse } from '../../../types/apiStatus'
import { GetProfileInfoProps } from '../../api/profile.api'
import { IDBCore } from '../../types'

type U<A, B> = [A, B]

type UserProfileR = U<ReceivedResponse<GetProfileInfoParams, UserProfileInfo>, ReceivedResponse<GetProfileInfoParams, UserProfileInfo>>
type UserProfileS = U<ReceivedResponse<UserProfileInfo, UserProfileInfo>, ReceivedResponse<UserProfileInfo, UserProfileInfo>>

export function createCoreDispatcher(store: IStorage<IDBCore>) {
  const loggerMiddleware = loggerDispatcherMiddleware()

  const dispatcher = createDispatcher({ storage: store, middlewares: [loggerMiddleware] }, (storage, { createAction, createWatcher }) => ({
    moduleEnter: createAction<{ email: string }, { email: string }>({
      type: 'moduleEnter',
      action: async (params) => params,
      meta: { description: 'Инициализация модуля' },
    }),

    // Добавляем watcher для отслеживания изменений профиля пользователя
    watchCurrentUserProfileUserInfo: createWatcher({
      type: 'watchCurrentUserProfileUserInfo',
      selector: (state) => state.api.profileInfo.apiData,
      shouldTrigger: (prev, curr) => prev?.user_info !== curr?.user_info,
      notifyAfterSubscribe: true,
      meta: { description: 'Следит за изменениями профиля пользователя -> user_info' },
    }),

    getUserProfileInit: createAction<GetProfileInfoProps, GetProfileInfoProps>({
      type: 'getUserProfileInit',
      meta: { description: 'Хотим отправить запрос на обновление профиля пользователя' },
      action: async (params) => params,
    }),
    getUserProfileRequest: createAction<UserProfileR[0], UserProfileR[1]>({
      type: 'updateUserInfoRequest',
      meta: { description: 'Отправляем запрос на обновление профиля пользователя' },
      action: async (responseData) => {
        await apiRequestStore(storage, responseData, 'profileInfo', 'request')
        return responseData
      },
    }),
    getUserProfileSuccess: createAction<UserProfileS[0], UserProfileS[1]>({
      type: 'updateUserInfoSuccess',
      meta: { description: 'Профиль пользователя успешно обновлен, получили ответ' },
      action: async (responseData) => {
        await apiRequestStore(storage, responseData, 'profileInfo', 'success')

        return responseData
      },
    }),
    getUserProfileError: createAction({
      type: 'updateUserInfoError',
      meta: { description: 'Ошибка в запросе обновления профиля пользователя' },
      action: async (responseData) => {
        await apiRequestStore(storage, responseData, 'profileInfo', 'failure')
        return responseData
      },
    }),
  }))


  return dispatcher
}

export type CoreDispatcher = ReturnType<typeof createCoreDispatcher>

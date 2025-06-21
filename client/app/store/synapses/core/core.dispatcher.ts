import { IStorage } from 'synapse-storage/core'
import { createDispatcher, loggerDispatcherMiddleware } from 'synapse-storage/reactive'
import { UserProfileInfo } from '../../../../../swagger/profile/interfaces-profile'
import { ReceivedResponse } from '../../../types/apiStatus'
import { GetProfileInfoProps } from '../../api/profile.api'
import { IDBCore } from '../../types'

export function createCoreDispatcher(store: IStorage<IDBCore>) {
  const loggerMiddleware = loggerDispatcherMiddleware({
    collapsed: true,
    colors: {
      title: '#3498db',
    },
  })

  return createDispatcher({ storage: store }, (storage, { createAction, createWatcher }) => ({
    setCurrentUserProfile: createAction<UserProfileInfo, UserProfileInfo>({
      type: 'setCurrentUserProfile',
      meta: { description: 'Установка полученного профиля (с серверной части)' },
      action: async (params) => {
        await storage.update((state) => {
          state.currentUserProfile = params
        })

        return params
      },
    }),
    // Добавляем watcher для отслеживания изменений профиля пользователя
    watchCurrentUserProfileUserInfo: createWatcher({
      type: 'watchCurrentUserProfileUserInfo',
      selector: (state) => state.currentUserProfile,
      shouldTrigger: (prev, curr) => prev?.user_info !== curr?.user_info,
      notifyAfterSubscribe: true,
      meta: { description: 'Следит за изменениями профиля пользователя -> user_info' },
    }),

    getUserProfileInit: createAction<GetProfileInfoProps, GetProfileInfoProps>({
      type: 'getUserProfileInit',
      meta: { description: 'Хотим отправить запрос на обновление профиля пользователя' },
      action: async (params) => params,
    }),
    getUserProfileSuccess: createAction<ReceivedResponse<UserProfileInfo, GetProfileInfoProps>, ReceivedResponse<UserProfileInfo, GetProfileInfoProps>>({
      type: 'getUserProfileSuccess',
      meta: { description: 'Профиль пользователя успешно обновлен, получили ответ' },
      action: async (responseData) => {
        await storage.update((state) => {
          state.currentUserProfile = responseData.data
        })
        return responseData
      },
    }),
  })).use(loggerMiddleware)
}

export type CoreDispatcher = ReturnType<typeof createCoreDispatcher>

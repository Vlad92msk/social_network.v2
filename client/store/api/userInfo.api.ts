import { SerializedError } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { UserInfo, UserInfoDto } from '../../../swagger/userInfo/interfaces-userInfo'
import { CookieType } from '../../app/types/cookie'
import { userInfoApiInstance } from '../instance'
import { RootState, store } from '../store'
// Тип для результатов запросов
type QueryResult<T> = {
  data?: T
  error?: SerializedError
  endpointName: string
  fulfilledTimeStamp?: number
  isError: boolean
  isLoading: boolean
  isSuccess: boolean
  isUninitialized: boolean
  requestId: string
  startedTimeStamp?: number
  status: 'pending' | 'fulfilled' | 'rejected'
}

export const userInfoApi = createApi({
  reducerPath: 'API_userInfo',
  tagTypes: ['User', 'Users'],
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState
      const profileId = state.profile?.profile?.id
      const userInfoId = state.profile?.profile?.user_info?.id

      if (profileId) {
        headers.set(CookieType.USER_PROFILE_ID, String(profileId))
      }
      if (userInfoId) {
        headers.set(CookieType.USER_INFO_ID, String(userInfoId))
      }
      return headers
    },
    credentials: 'include',
  }),
  endpoints: (builder) => ({

    getUsers: builder.query<UserInfoDto[], Parameters<typeof userInfoApiInstance.getUsers>[0]>({
      query: (params) => {
        const { url, init } = userInfoApiInstance.getUsersInit(params)
        return { url, ...init }
      },
      providesTags: ['Users'],
    }),

    updateUser: builder.mutation<UserInfo, Parameters<typeof userInfoApiInstance.updateUser>[0]>({
      query: (params) => {
        const { url, init } = userInfoApiInstance.updateUserInit(params)
        return { url, ...init }
      },
      invalidatesTags: ['User', 'Users'],
      // Функция которая вызывается после того как вызывался метод
      async onQueryStarted({ body }, { dispatch, queryFulfilled, getState }) {
        const previousUserInfo = (getState() as RootState).profile.profile?.user_info

        // Создаем предполагаемое новое состояние на основе FormData
        const optimisticUpdate = { ...previousUserInfo }
        // @ts-ignore
        for (const [key, value] of body.entries()) {
          if (typeof value === 'string') {
            optimisticUpdate[key] = value
          }
        }

        // Оптимистично обновляем кэш getUserById
        const patchResult = dispatch(
        // @ts-ignore
          userInfoApi.util.updateQueryData('getUserById', previousUserInfo.id, (draft) => {
            Object.assign(draft, optimisticUpdate)
          }),
        )

        try {
          // Ожидаем завершения запроса
          const { data } = await queryFulfilled

          // Обновляем кэш getUserById данными с сервера
          dispatch(
          // @ts-ignore
            userInfoApi.util.updateQueryData('getUserById', previousUserInfo.id, (draft) => {
              Object.assign(draft, data)
            }),
          )
        } catch (error) {
          // Откатываем изменения в кэше getUserById
          patchResult.undo()
        }
      },
    }),

    getUserById: builder.query<UserInfoDto, Parameters<typeof userInfoApiInstance.getUserById>[0]>({
      query: (params) => {
        const { url, init } = userInfoApiInstance.getUserByIdInit(params)
        return { url, ...init }
      },
      providesTags: ['User'],
    }),
  }),
})

// Типизированные функции-обертки в объекте
export const UserInfoApiApi = {

  getUsers: (props: Parameters<typeof userInfoApiInstance.getUsers>[0]): Promise<QueryResult<UserInfoDto[]>> => store.dispatch(userInfoApi.endpoints.getUsers.initiate(props)),

  updateUser: (props: Parameters<typeof userInfoApiInstance.updateUser>[0]): Promise<QueryResult<UserInfoDto>> => store.dispatch(userInfoApi.endpoints.updateUser.initiate(props)),

  getUserById: (props: Parameters<typeof userInfoApiInstance.getUserById>[0]): Promise<QueryResult<UserInfoDto>> => store.dispatch(userInfoApi.endpoints.getUserById.initiate(props)),
}

// Экспорт типов для использования в других частях приложения
export type UserInfoApiApiType = typeof UserInfoApiApi

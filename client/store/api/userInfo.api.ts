import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { UserInfo, UserInfoDto } from '../../../swagger/userInfo/interfaces-userInfo'
import { CookieType } from '../../app/types/cookie'
import { userInfoApiInstance } from '../instance'
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store'


export const userInfoApi = createApi({
  reducerPath: 'API_userInfo',
  tagTypes: ['User', 'Users'],
  baseQuery: fetchBaseQuery({
    credentials: 'include',
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

    getOneUserByParams: builder.query<UserInfoDto, Parameters<typeof userInfoApiInstance.getOneUserByParams>[0]>({
      query: (params) => {
        const { url, init } = userInfoApiInstance.getOneUserByParamsInit(params)
        return { url, ...init }
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

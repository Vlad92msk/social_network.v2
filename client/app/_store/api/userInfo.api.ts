import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../types/cookie'
import { userInfoApiInstance } from '../../../apiInstance/userInfo.instance'

export const userInfoApi = createApi({
  reducerPath: 'API_userInfo',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState()
      // @ts-ignore
      const profileId = state.profile.id
      // @ts-ignore
      const userInfoId = state.profile.user_info.id

      headers.set(CookieType.USER_PROFILE_ID, String(profileId));
      headers.set(CookieType.USER_INFO_ID, String(userInfoId));
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getUsers: builder.query<
          ReturnType<typeof userInfoApiInstance.getUsers>,
          Parameters<typeof userInfoApiInstance.getUsersInit>[0]
        >({
          // query: userInfoApiInstance.getUsersInit,
          query: (params) => {
            const { url, ...rest } = userInfoApiInstance.getUsersInit(params)
            return ({ url, ...rest })
          },
        }),
    updateUser: builder.mutation<
          ReturnType<typeof userInfoApiInstance.updateUser>,
          Parameters<typeof userInfoApiInstance.updateUserInit>[0]
        >({
          // query: userInfoApiInstance.updateUserInit,
          query: (params) => {
            const { url, ...rest } = userInfoApiInstance.updateUserInit(params)
            return ({ url, ...rest })
          },
        }),
    getUserById: builder.query<
          ReturnType<typeof userInfoApiInstance.getUserById>,
          Parameters<typeof userInfoApiInstance.getUserByIdInit>[0]
        >({
          // query: userInfoApiInstance.getUserByIdInit,
          query: (params) => {
            const { url, ...rest } = userInfoApiInstance.getUserByIdInit(params)
            return ({ url, ...rest })
          },
        }),
  }),
})

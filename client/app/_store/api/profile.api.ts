import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../types/cookie'
import { profileApiInstance } from '../../../apiInstance/profile.instance'

export const profileApi = createApi({
  reducerPath: 'API_profile',
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
    getProfileInfo: builder.query<
          ReturnType<typeof profileApiInstance.getProfileInfo>,
          Parameters<typeof profileApiInstance.getProfileInfoInit>[0]
        >({
          // query: profileApiInstance.getProfileInfoInit,
          query: (params) => {
            const { url, ...rest } = profileApiInstance.getProfileInfoInit(params)
            return ({ url, ...rest })
          },
        }),
  }),
})

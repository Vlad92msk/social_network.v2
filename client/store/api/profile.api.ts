import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { UserProfileInfo } from '../../../swagger/profile/interfaces-profile'
import { CookieType } from '../../app/types/cookie'
import { profileApiInstance } from '../instance'
import { RootReducer } from '../root.reducer'

export const profileApi = createApi({
  reducerPath: 'API_profile',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootReducer
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

    getProfileInfo: builder.query<UserProfileInfo, Parameters<typeof profileApiInstance.getProfileInfo>[0]>({
      query: (params) => {
        const { url, init } = profileApiInstance.getProfileInfoInit(params)
        return { url, ...init }
      },
    }),

    getProfiles: builder.query<UserProfileInfo[], Parameters<typeof profileApiInstance.getProfiles>[0]>({
      query: (params) => {
        const { url, init } = profileApiInstance.getProfilesInit(params)
        return { url, ...init }
      },
    }),

    removeProfile: builder.mutation<any, Parameters<typeof profileApiInstance.removeProfile>[0]>({
      query: (params) => {
        const { url, init } = profileApiInstance.removeProfileInit(params)
        return { url, ...init }
      },
    }),
  }),
})

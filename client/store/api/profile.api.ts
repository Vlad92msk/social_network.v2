
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../app/types/cookie';
import { RootState, store } from '../store'
import { profileApiInstance } from '../../store/instance'
import { CreateProfileDto, UserAbout, MediaMetadata, PublicationType, DialogEntity, MessageEntity, ReactionEntity, CommentEntity, PostVisibility, PostEntity, Tag, MediaEntity, UserInfo, Settings, UserProfileInfo } from '../../../swagger/profile/interfaces-profile'
import { SerializedError } from '@reduxjs/toolkit'
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

export const profileApi = createApi({
  reducerPath: 'API_profile',
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

// Типизированные функции-обертки в объекте
export const ProfileApiApi = {
  
  getProfileInfo: (props: Parameters<typeof profileApiInstance.getProfileInfo>[0]): Promise<QueryResult<UserProfileInfo>> =>
    store.dispatch(profileApi.endpoints.getProfileInfo.initiate(props)),

  getProfiles: (props: Parameters<typeof profileApiInstance.getProfiles>[0]): Promise<QueryResult<UserProfileInfo[]>> =>
    store.dispatch(profileApi.endpoints.getProfiles.initiate(props)),

  removeProfile: (props: Parameters<typeof profileApiInstance.removeProfile>[0]): Promise<QueryResult<any>> =>
    store.dispatch(profileApi.endpoints.removeProfile.initiate(props))
};

// Экспорт типов для использования в других частях приложения
export type ProfileApiApiType = typeof ProfileApiApi

import { SerializedError } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CalculateReactionsResponse } from '../../../swagger/reactions/interfaces-reactions'
import { CookieType } from '../../app/types/cookie'
import { reactionsApiInstance } from '../instance'
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

export const reactionsApi = createApi({
  reducerPath: 'API_reactions',
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

    create: builder.mutation<CalculateReactionsResponse, Parameters<typeof reactionsApiInstance.create>[0]>({
      query: (params) => {
        const { url, init } = reactionsApiInstance.createInit(params)
        return { url, ...init }
      },
    }),

    getReactions: builder.query<CalculateReactionsResponse, Parameters<typeof reactionsApiInstance.getReactions>[0]>({
      query: (params) => {
        const { url, init } = reactionsApiInstance.getReactionsInit(params)
        return { url, ...init }
      },
    }),

    reactionUpdates: builder.mutation<any, Parameters<typeof reactionsApiInstance.reactionUpdates>[0]>({
      query: (params) => {
        const { url, init } = reactionsApiInstance.reactionUpdatesInit(params)
        return { url, ...init }
      },
    }),
  }),
})

// Типизированные функции-обертки в объекте
export const ReactionsApiApi = {

  create: (props: Parameters<typeof reactionsApiInstance.create>[0]): Promise<QueryResult<CalculateReactionsResponse>> => store.dispatch(reactionsApi.endpoints.create.initiate(props)),

  getReactions: (props: Parameters<typeof reactionsApiInstance.getReactions>[0]): Promise<QueryResult<CalculateReactionsResponse>> => store.dispatch(reactionsApi.endpoints.getReactions.initiate(props)),

  reactionUpdates: (props: Parameters<typeof reactionsApiInstance.reactionUpdates>[0]): Promise<QueryResult<any>> => store.dispatch(reactionsApi.endpoints.reactionUpdates.initiate(props)),
}

// Экспорт типов для использования в других частях приложения
export type ReactionsApiApiType = typeof ReactionsApiApi

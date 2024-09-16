
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../app/types/cookie';
import { RootState, store } from '../store'
import { tagsApiInstance } from '../../store/instance'
import { CreateTagDto, MediaMetadata, UserAbout, PublicationType, Tag, PostVisibility, PostEntity, CommentEntity, DialogEntity, MessageEntity, ReactionEntity, UserInfo, MediaEntity, UpdateTagDto } from '../../../swagger/tags/interfaces-tags'
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

export const tagsApi = createApi({
  reducerPath: 'API_tags',
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
    
    createTag: builder.mutation<Tag, Parameters<typeof tagsApiInstance.createTag>[0]>({
      query: (params) => {
        const { url, init } = tagsApiInstance.createTagInit(params)
        return { url, ...init }
      },
    }),

    findTags: builder.query<Tag[], Parameters<typeof tagsApiInstance.findTags>[0]>({
      query: (params) => {
        const { url, init } = tagsApiInstance.findTagsInit(params)
        return { url, ...init }
      },
    }),

    findTagById: builder.query<Tag, Parameters<typeof tagsApiInstance.findTagById>[0]>({
      query: (params) => {
        const { url, init } = tagsApiInstance.findTagByIdInit(params)
        return { url, ...init }
      },
    }),

    updateTag: builder.mutation<Tag, Parameters<typeof tagsApiInstance.updateTag>[0]>({
      query: (params) => {
        const { url, init } = tagsApiInstance.updateTagInit(params)
        return { url, ...init }
      },
    }),

    deleteTag: builder.mutation<any, Parameters<typeof tagsApiInstance.deleteTag>[0]>({
      query: (params) => {
        const { url, init } = tagsApiInstance.deleteTagInit(params)
        return { url, ...init }
      },
    }),

    findTagsByIds: builder.query<Tag[], Parameters<typeof tagsApiInstance.findTagsByIds>[0]>({
      query: (params) => {
        const { url, init } = tagsApiInstance.findTagsByIdsInit(params)
        return { url, ...init }
      },
    }),
  }),
})

// Типизированные функции-обертки в объекте
export const TagsApiApi = {
  
  createTag: (props: Parameters<typeof tagsApiInstance.createTag>[0]): Promise<QueryResult<Tag>> =>
    store.dispatch(tagsApi.endpoints.createTag.initiate(props)),

  findTags: (props: Parameters<typeof tagsApiInstance.findTags>[0]): Promise<QueryResult<Tag[]>> =>
    store.dispatch(tagsApi.endpoints.findTags.initiate(props)),

  findTagById: (props: Parameters<typeof tagsApiInstance.findTagById>[0]): Promise<QueryResult<Tag>> =>
    store.dispatch(tagsApi.endpoints.findTagById.initiate(props)),

  updateTag: (props: Parameters<typeof tagsApiInstance.updateTag>[0]): Promise<QueryResult<Tag>> =>
    store.dispatch(tagsApi.endpoints.updateTag.initiate(props)),

  deleteTag: (props: Parameters<typeof tagsApiInstance.deleteTag>[0]): Promise<QueryResult<any>> =>
    store.dispatch(tagsApi.endpoints.deleteTag.initiate(props)),

  findTagsByIds: (props: Parameters<typeof tagsApiInstance.findTagsByIds>[0]): Promise<QueryResult<Tag[]>> =>
    store.dispatch(tagsApi.endpoints.findTagsByIds.initiate(props))
};

// Экспорт типов для использования в других частях приложения
export type TagsApiApiType = typeof TagsApiApi

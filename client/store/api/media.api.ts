
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../app/types/cookie';
import { RootState, store } from '../store'
import { mediaApiInstance } from '../../store/instance'
import { MediaMetadata, UserAbout, PublicationType, DialogEntity, MessageEntity, ReactionEntity, CommentEntity, PostVisibility, PostEntity, Tag, MediaEntity, UserInfo } from '../../../swagger/media/interfaces-media'
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

export const mediaApi = createApi({
  reducerPath: 'API_media',
  tagTypes: ['MediaFiles'],
  baseQuery: fetchBaseQuery({
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState
      const profileId = state.profile?.profile?.id
      const userInfoId = state.profile?.profile?.user_info?.id
      const publicId = state.profile?.profile?.user_info?.public_id

      if (profileId) {
        headers.set(CookieType.USER_PROFILE_ID, String(profileId))
      }
      if (userInfoId) {
        headers.set(CookieType.USER_INFO_ID, String(userInfoId))
      }
      if (publicId) {
        headers.set(CookieType.USER_PUBLIC_ID, String(publicId))
      }
      return headers
    },
  }),
  endpoints: (builder) => ({

    uploadFiles: builder.mutation<MediaEntity[], Parameters<typeof mediaApiInstance.uploadFiles>[0]>({
      query: (params) => {
        const { url, init } = mediaApiInstance.uploadFilesInit(params)
        return { url, ...init }
      },
    }),

    downLoadFile: builder.mutation<any, Parameters<typeof mediaApiInstance.downLoadFile>[0]>({
      query: (params) => {
        const { url, init } = mediaApiInstance.downLoadFileInit(params)
        return { url, ...init }
      },
    }),

    deleteFile: builder.mutation<any, Parameters<typeof mediaApiInstance.deleteFile>[0]>({
      query: (params) => {
        const { url, init } = mediaApiInstance.deleteFileInit(params)
        return { url, ...init }
      },
    }),

    getFiles: builder.query<MediaEntity[], Parameters<typeof mediaApiInstance.getFiles>[0]>({
      providesTags: ['MediaFiles'],
      query: (params) => {
        const { url, init } = mediaApiInstance.getFilesInit(params)
        return { url, ...init }
      },
    }),

    updateMedia: builder.mutation<any, Parameters<typeof mediaApiInstance.updateMedia>[0]>({
      query: (params) => {
        const { url, init } = mediaApiInstance.updateMediaInit(params)
        return { url, ...init }
      },
    }),


    addTagsToMedia: builder.mutation<MediaEntity, Parameters<typeof mediaApiInstance.addTagsToMedia>[0]>({
      query: (params) => {
        const { url, init } = mediaApiInstance.addTagsToMediaInit(params)
        return { url, ...init }
      },
    }),

    removeTagsFromMedia: builder.mutation<MediaEntity, Parameters<typeof mediaApiInstance.removeTagsFromMedia>[0]>({
      query: (params) => {
        const { url, init } = mediaApiInstance.removeTagsFromMediaInit(params)
        return { url, ...init }
      },
    }),

    getMediaTags: builder.query<Tag[], Parameters<typeof mediaApiInstance.getMediaTags>[0]>({
      query: (params) => {
        const { url, init } = mediaApiInstance.getMediaTagsInit(params)
        return { url, ...init }
      },
    }),
  }),
})

// Типизированные функции-обертки в объекте
export const MediaApiApi = {

  uploadFiles: (props: Parameters<typeof mediaApiInstance.uploadFiles>[0]): Promise<QueryResult<MediaEntity[]>> =>
    store.dispatch(mediaApi.endpoints.uploadFiles.initiate(props)),

  downLoadFile: (props: Parameters<typeof mediaApiInstance.downLoadFile>[0]): Promise<QueryResult<any>> =>
    store.dispatch(mediaApi.endpoints.downLoadFile.initiate(props)),

  deleteFile: (props: Parameters<typeof mediaApiInstance.deleteFile>[0]): Promise<QueryResult<any>> =>
    store.dispatch(mediaApi.endpoints.deleteFile.initiate(props)),

  getFiles: (props: Parameters<typeof mediaApiInstance.getFiles>[0]): Promise<QueryResult<MediaEntity[]>> =>
    store.dispatch(mediaApi.endpoints.getFiles.initiate(props)),

  updateMedia: (props: Parameters<typeof mediaApiInstance.updateMedia>[0]): Promise<QueryResult<any>> =>
    store.dispatch(mediaApi.endpoints.updateMedia.initiate(props)),


  addTagsToMedia: (props: Parameters<typeof mediaApiInstance.addTagsToMedia>[0]): Promise<QueryResult<MediaEntity>> =>
    store.dispatch(mediaApi.endpoints.addTagsToMedia.initiate(props)),

  removeTagsFromMedia: (props: Parameters<typeof mediaApiInstance.removeTagsFromMedia>[0]): Promise<QueryResult<MediaEntity>> =>
    store.dispatch(mediaApi.endpoints.removeTagsFromMedia.initiate(props)),

  getMediaTags: (props: Parameters<typeof mediaApiInstance.getMediaTags>[0]): Promise<QueryResult<Tag[]>> =>
    store.dispatch(mediaApi.endpoints.getMediaTags.initiate(props))
};

// Экспорт типов для использования в других частях приложения
export type MediaApiApiType = typeof MediaApiApi

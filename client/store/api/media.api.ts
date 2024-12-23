import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
// import { HYDRATE } from 'next-redux-wrapper'
import { MediaEntity, Tag } from '../../../swagger/media/interfaces-media'
import { CookieType } from '../../app/types/cookie'
import { mediaApiInstance } from '../../store/instance'
import { RootState } from '../store'

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
  keepUnusedDataFor: 3600, // Хранить кэш 1 час
  // extractRehydrationInfo(action, { reducerPath }) {
  //   if (action.type === HYDRATE && action.payload) {
  //     return action.payload[reducerPath]
  //   }
  // },
  endpoints: (builder) => ({

    uploadFiles: builder.mutation<MediaEntity[], Parameters<typeof mediaApiInstance.uploadFiles>[0]>({
      invalidatesTags: ['MediaFiles'],
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
      invalidatesTags: ['MediaFiles'],
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
      invalidatesTags: ['MediaFiles'],
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

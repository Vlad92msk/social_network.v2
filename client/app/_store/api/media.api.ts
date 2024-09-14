import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { mediaApiInstance } from '../../../apiInstance/media.instance'

export const mediaApi = createApi({
  reducerPath: 'API_media',
  baseQuery: fetchBaseQuery({
    // baseUrl: '',
    // prepareHeaders: (headers, { getState }) => {
    //   // @ts-ignore
    //   const token = (getState()).auth.token;
    //   if (token) {
    //     headers.set('authorization', `Bearer ${token}`);
    //   }
    //   return headers;
    // },
  }),
  endpoints: (builder) => ({
    uploadFiles: builder.mutation<
          ReturnType<typeof mediaApiInstance.uploadFiles>,
          Parameters<typeof mediaApiInstance.uploadFilesInit>[0]
        >({
          // query: mediaApiInstance.uploadFilesInit,
          query: (params) => {
            const { url, ...rest } = mediaApiInstance.uploadFilesInit(params)
            return ({ url, ...rest })
          },
        }),
    downLoadFile: builder.mutation<
          ReturnType<typeof mediaApiInstance.downLoadFile>,
          Parameters<typeof mediaApiInstance.downLoadFileInit>[0]
        >({
          // query: mediaApiInstance.downLoadFileInit,
          query: (params) => {
            const { url, ...rest } = mediaApiInstance.downLoadFileInit(params)
            return ({ url, ...rest })
          },
        }),
    deleteFile: builder.mutation<
          ReturnType<typeof mediaApiInstance.deleteFile>,
          Parameters<typeof mediaApiInstance.deleteFileInit>[0]
        >({
          // query: mediaApiInstance.deleteFileInit,
          query: (params) => {
            const { url, ...rest } = mediaApiInstance.deleteFileInit(params)
            return ({ url, ...rest })
          },
        }),
    getFiles: builder.query<
          ReturnType<typeof mediaApiInstance.getFiles>,
          Parameters<typeof mediaApiInstance.getFilesInit>[0]
        >({
          // query: mediaApiInstance.getFilesInit,
          query: (params) => {
            const { url, ...rest } = mediaApiInstance.getFilesInit(params)
            return ({ url, ...rest })
          },
        }),
    addTagsToMedia: builder.mutation<
          ReturnType<typeof mediaApiInstance.addTagsToMedia>,
          Parameters<typeof mediaApiInstance.addTagsToMediaInit>[0]
        >({
          // query: mediaApiInstance.addTagsToMediaInit,
          query: (params) => {
            const { url, ...rest } = mediaApiInstance.addTagsToMediaInit(params)
            return ({ url, ...rest })
          },
        }),
    removeTagsFromMedia: builder.mutation<
          ReturnType<typeof mediaApiInstance.removeTagsFromMedia>,
          Parameters<typeof mediaApiInstance.removeTagsFromMediaInit>[0]
        >({
          // query: mediaApiInstance.removeTagsFromMediaInit,
          query: (params) => {
            const { url, ...rest } = mediaApiInstance.removeTagsFromMediaInit(params)
            return ({ url, ...rest })
          },
        }),
    getMediaTags: builder.query<
          ReturnType<typeof mediaApiInstance.getMediaTags>,
          Parameters<typeof mediaApiInstance.getMediaTagsInit>[0]
        >({
          // query: mediaApiInstance.getMediaTagsInit,
          query: (params) => {
            const { url, ...rest } = mediaApiInstance.getMediaTagsInit(params)
            return ({ url, ...rest })
          },
        }),
  }),
})

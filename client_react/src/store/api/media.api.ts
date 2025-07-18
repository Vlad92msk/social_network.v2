import { API__USER_MEDIA } from '@store/indexdb.config.ts'
import { ApiClient, ResponseFormat } from 'synapse-storage/api'

import { MediaEntity, Tag } from '../../../../swagger/media/interfaces-media.ts'
import { mediaApiInstance } from '../../../generate/instance'
import { CookieType } from '../../models/cookie.ts'

export type UploadFilesPayload = Parameters<typeof mediaApiInstance.uploadFiles>[0]
export type DownLoadFilePayload = Parameters<typeof mediaApiInstance.downLoadFile>[0]
export type DeleteFilePayload = Parameters<typeof mediaApiInstance.deleteFile>[0]
export type GetFilesPayload = Parameters<typeof mediaApiInstance.getFiles>[0]
export type UpdateMediaPayload = Parameters<typeof mediaApiInstance.updateMedia>[0]
export type AddTagsToMediaPayload = Parameters<typeof mediaApiInstance.addTagsToMedia>[0]
export type RemoveTagsFromMediaPayload = Parameters<typeof mediaApiInstance.removeTagsFromMedia>[0]
export type GetMediaTagsPayload = Parameters<typeof mediaApiInstance.getMediaTags>[0]

const api = new ApiClient({
  storage: API__USER_MEDIA,
  cache: {
    ttl: 5 * 60 * 1000, // 5 минут
    invalidateOnError: true, //  Инвалидировать кэш при ошибке
  },
  baseQuery: {
    baseUrl: '',
    timeout: 10000,
    credentials: 'include',
    prepareHeaders: async (headers, { getCookie }) => {
      const profileId = getCookie(CookieType.USER_INFO_ID)
      const userInfoId = getCookie(CookieType.USER_PROFILE_ID)
      const publicId = getCookie(CookieType.USER_PUBLIC_ID)

      if (publicId) {
        headers.set(CookieType.USER_PUBLIC_ID, String(publicId))
      }

      if (profileId) {
        headers.set(CookieType.USER_PROFILE_ID, String(profileId))
      }
      if (userInfoId) {
        headers.set(CookieType.USER_INFO_ID, String(userInfoId))
      }
      return headers
    },
  },
  endpoints: async (create) => ({
    uploadFiles: create<UploadFilesPayload, MediaEntity[]>({
      invalidatesTags: ['MediaFiles'],
      // @ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.uploadFilesInit(params)
        return { path: url, ...init }
      },
    }),

    downLoadFile: create<DownLoadFilePayload, any>({
      //@ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.downLoadFileInit(params)
        return { path: url, ...init }
      },
    }),

    deleteFile: create<DeleteFilePayload, any>({
      invalidatesTags: ['MediaFiles'],
      //@ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.deleteFileInit(params)
        return { path: url, ...init }
      },
    }),

    getFiles: create<GetFilesPayload, MediaEntity[]>({
      tags: ['MediaFiles'],
      //@ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.getFilesInit(params)
        return {
          path: url,
          method: 'GET',
          ...init,
        }
      },
    }),

    updateMedia: create<UpdateMediaPayload, any>({
      invalidatesTags: ['MediaFiles'],
      cache: false,

      prepareHeaders: async (headers, { getCookie }) => {
        // Возможно нужно добавить:
        headers.set('Content-Type', 'application/json')

        return headers
      },
      request: (params) => {
        const { url } = mediaApiInstance.updateMediaInit(params)
        return {
          path: url,
          method: 'PATCH',
          responseFormat: ResponseFormat.Text,
          body: params.body,
        }
      },
    }),

    addTagsToMedia: create<AddTagsToMediaPayload, MediaEntity>({
      //@ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.addTagsToMediaInit(params)
        return { path: url, ...init }
      },
    }),

    removeTagsFromMedia: create<RemoveTagsFromMediaPayload, MediaEntity>({
      //@ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.removeTagsFromMediaInit(params)
        return { path: url, ...init }
      },
    }),

    getMediaTags: create<GetMediaTagsPayload, Tag[]>({
      //@ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.getMediaTagsInit(params)
        return { path: url, ...init }
      },
    }),
  }),
})
// Инициализация
const userMediaApi = await api.init()

// Получение эндпоинтов
export const userMediaEndpoints = userMediaApi.getEndpoints()
export type UserMediaApi = typeof userMediaEndpoints

import { API__USER_MEDIA } from '@store/indexdb.config.ts'
import { ApiClient } from 'synapse-storage/api'

import { MediaEntity, Tag } from '../../../../swagger/media/interfaces-media.ts'
import { mediaApiInstance } from '../../../generate/instance'
import { CookieType } from '../../models/cookie.ts'

type UploadFilesPayload = Parameters<typeof mediaApiInstance.uploadFiles>[0]
type DownLoadFilePayload = Parameters<typeof mediaApiInstance.downLoadFile>[0]
type DeleteFilePayload = Parameters<typeof mediaApiInstance.deleteFile>[0]
type GetFilesPayload = Parameters<typeof mediaApiInstance.getFiles>[0]
type UpdateMediaPayload = Parameters<typeof mediaApiInstance.updateMedia>[0]
type AddTagsToMediaPayload = Parameters<typeof mediaApiInstance.addTagsToMedia>[0]
type RemoveTagsFromMediaPayload = Parameters<typeof mediaApiInstance.removeTagsFromMedia>[0]
type GetMediaTagsPayload = Parameters<typeof mediaApiInstance.getMediaTags>[0]

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
      providesTags: ['MediaFiles'],
      //@ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.getFilesInit(params)
        return { path: url, ...init }
      },
    }),

    updateMedia: create<UpdateMediaPayload, any>({
      invalidatesTags: ['MediaFiles'],
      //@ts-ignore
      request: (params) => {
        const { url, init } = mediaApiInstance.updateMediaInit(params)
        return { path: url, ...init }
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
const userProfileApi = await api.init()

// Получение эндпоинтов
export const userProfileEndpoints = userProfileApi.getEndpoints()
export type UserProfileApi = typeof userProfileEndpoints

import { ApiClient } from 'synapse-storage/api'
import { UserProfileInfo } from '../../../../swagger/profile/interfaces-profile'
import { profileApiInstance } from '../../../store/instance'
import { CookieType } from '../../types/cookie'
import { API__USER_PROFILE } from '../indexdb.config'

export type GetProfileInfoProps = Parameters<typeof profileApiInstance.getProfileInfo>[0]

const api = new ApiClient({
  storage: API__USER_PROFILE,
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
    getProfileInfo: create<GetProfileInfoProps, UserProfileInfo>({
      cache: false,
      // @ts-ignore
      request: (params) => {
        const { url, init } = profileApiInstance.getProfileInfoInit(params)
        return ({
          body: params.body,
          path: url,
          method: 'POST',
        })
      },
      tags: ['profile-info'],
    }),

    getProfiles: create<Parameters<typeof profileApiInstance.getProfiles>[0], UserProfileInfo[]>({
      // @ts-ignore
      request: (params) => {
        const { url, init } = profileApiInstance.getProfilesInit(params)
        return { path: url, ...init }
      },
    }),

    removeProfile: create<Parameters<typeof profileApiInstance.removeProfile>[0], any>({
      // @ts-ignore
      request: (params) => {
        const { url, init } = profileApiInstance.removeProfileInit(params)
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

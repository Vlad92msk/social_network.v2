import { ApiClient, ResponseFormat } from 'synapse-storage/api'
import { UserInfo, UserInfoDto } from '../../../../swagger/userInfo/interfaces-userInfo'
import { userInfoApiInstance } from '../../../store/instance'
import { CookieType } from '../../types/cookie'
import { API__USER_INFO } from '../indexdb.config'

const api = new ApiClient({
  storage: API__USER_INFO,
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
    getUserById: create<Parameters<typeof userInfoApiInstance.getUserById>[0], UserInfoDto>({
      request: (params) => {
        const { url } = userInfoApiInstance.getUserByIdInit(params)
        return ({
          path: url,
          method: 'GET',
          responseFormat: ResponseFormat.Json,
        })
      },
      tags: ['current-user'],
    }),
    updateUser: create<Parameters<typeof userInfoApiInstance.updateUser>[0], UserInfo>({
      cache: false,
      request: (params) => {
        const { url } = userInfoApiInstance.updateUserInit(params)
        return ({
          path: url,
          body: params.body,
          method: 'PUT',
        })
      },
      invalidatesTags: ['current-user'],
    }),
  }),
})
// Инициализация
const userInfoApi = await api.init()

// Получение эндпоинтов
export const userInfoEndpoints = userInfoApi.getEndpoints()

export type UserInfoApi = typeof userInfoEndpoints

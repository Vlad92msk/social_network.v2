import { GetProfileInfoParams } from '../../../swagger/profile/api-client-profile.ts'
import { UserProfileInfo } from '../../../swagger/profile/interfaces-profile'
import { ApiStatusState } from '../types/apiStatus'

// Основные данные проекта в indexDB
export interface IDBCore {
   api: {
      profileInfo: ApiStatusState<UserProfileInfo, GetProfileInfoParams>
   }
}

export type IDBApi = Record<string, unknown>

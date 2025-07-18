import { GetProfileInfoParams } from '../../../swagger/profile/api-client-profile.ts'
import { UserProfileInfo } from '../../../swagger/profile/interfaces-profile'
import { ApiStatusState } from '../models/apiStatus'

// Основные данные проекта в indexDB
export interface IDBCore {
  api: {
    profileInfo: ApiStatusState<GetProfileInfoParams, UserProfileInfo>
  }
}

export type IDBApi = Record<string, unknown>

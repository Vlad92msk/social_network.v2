import { UserProfileInfo } from '../../../swagger/profile/interfaces-profile'
import { ApiStatusState } from '../types/apiStatus'

// Основные данные проекта в indexDB
export interface IDBCore {
   currentUserProfile?: UserProfileInfo
}

export type IDBApi = Record<string, unknown>

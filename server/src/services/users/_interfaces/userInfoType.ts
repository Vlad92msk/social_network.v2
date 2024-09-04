import { UserAboutType } from './userAboutType'

/**
 * @summary Информация о пользователе / канале
 * @description
 */
export interface UserInfoType {
    id: number
    /** Публичный ID */
    public_id: string
    /** Имя */
    name: string
    /** Фото профиля */
    profile_image: string
    /** Общая информация о пользователе */
    about_info: UserAboutType
}

export enum UserStatus {
    Online = 'online',
    Offline = 'offline',
}

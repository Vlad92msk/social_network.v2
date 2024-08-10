import { UserInfoType } from "@src/services/users/_interfaces";
import { ProfileSettings } from "./settings";

/**
 * @summary Тип профиля
 * @enum {string}
 * @variation profile - пользователь
 * @variation channel - канал
 * */
export enum ProfileType {
    USER = 'user',
    CHANNEL = 'channel'
}

/**
 * @summary Информация о профиле
 */
export interface ProfileInfoType {
    id: number
    /** email */
    email: string
    /**
     * @summary Тип профиля
     * @enum {string}
     * @variation profile - пользователь
     * @variation channel - канал
     * */
    type: ProfileType
    /** Информация о пользователе / канале */
    user_info: UserInfoType
    settings: ProfileSettings
}

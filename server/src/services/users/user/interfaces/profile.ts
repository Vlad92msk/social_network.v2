/**
 * Профиль пользователя
 */
export interface UserProfileType {
    id: number
    uuid: string
    email: string
    userInfo?: any
    dialogsIds?: string[]
}

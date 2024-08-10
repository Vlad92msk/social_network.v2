/**
 * @summary Общая информация о пользователе
 */
export interface UserAboutType {
    id: number
    /** Место учебы */
    study: string
    /** место работы */
    working: string
    /** Должность */
    position: string
    /** Описание */
    description: string
    /** Фото баннера */
    banner_image: string
}

export enum DialogEvents {
    /** Получить краткие диалоги */
    GET_DIALOGS = 'get_dialogs',

    /** Создался диалог */
    NEW_DIALOG = 'new_dialog',

    /** Присоединение к диалогу */
    JOIN_DIALOG = 'join_dialog',

    /** Выход из диалога */
    LEAVE_DIALOG = 'leave_dialog',

    /** Выход из диалога */
    REMOVE_DIALOG = 'remove_dialog',

    /** Отправка сообщения */
    SEND_MESSAGE = 'send_message',

    /** Начало набора сообщения */
    START_TYPING = 'start_typing',

    /** Окончание набора сообщения */
    STOP_TYPING = 'stop_typing',

    /** Изменение статуса пользователя (онлайн/оффлайн) */
    USER_STATUS_CHANGED = 'user_status_changed',

    /** История диалога (сообщения и участники) */
    DIALOG_HISTORY = 'dialog_history',

    /** Новое сообщение */
    NEW_MESSAGE = 'new_message',

    /** Обновление краткой информации о диалоге */
    DIALOG_SHORT_UPDATED = 'dialog_short_updated',

    /** Обновление краткой информации о диалоге */
    DIALOG_UPDATED = 'dialog_updated',

    /** Пользователь печатает */
    USER_TYPING = 'user_typing',

    /** Обновилось фото диалога */
    DIALOG_IMAGE_UPDATED = 'dialog_image_updated',

    /** Обновлилось последнее сообщение */
    DIALOG_LAST_MESSAGE_UPDATED = 'dialog_last_message_updated',

    /** Начало конференции */
    VIDEO_CONFERENCE_STARTED = 'video_conference_started',

    /** Конец конференции */
    VIDEO_CONFERENCE_ENDED = 'video_conference_ended',
}

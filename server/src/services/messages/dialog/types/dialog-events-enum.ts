export enum DialogEvents {
    /** Присоединение к диалогу */
    JOIN_DIALOG = 'joinDialog',

    /** Выход из диалога */
    LEAVE_DIALOG = 'leaveDialog',

    /** Отправка сообщения */
    SEND_MESSAGE = 'sendMessage',

    /** Начало набора сообщения */
    START_TYPING = 'startTyping',

    /** Окончание набора сообщения */
    STOP_TYPING = 'stopTyping',

    /** Изменение статуса пользователя (онлайн/оффлайн) */
    USER_STATUS_CHANGED = 'userStatusChanged',

    /** История диалога (сообщения и участники) */
    DIALOG_HISTORY = 'dialogHistory',

    /** Новое сообщение */
    NEW_MESSAGE = 'newMessage',

    /** Обновление краткой информации о диалоге */
    DIALOG_SHORT_UPDATED = 'dialogShortUpdated',

    /** Пользователь печатает */
    USER_TYPING = 'userTyping'
}

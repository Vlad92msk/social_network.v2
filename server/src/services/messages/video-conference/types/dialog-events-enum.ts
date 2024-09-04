export enum DialogEvents {
    /** Присоединение к видеоконференции */
    JOIN_CONFERENCE = 'join_conference',

    /** Покидание видеоконференции */
    LEAVE_CONFERENCE = 'leave_conference',

    /** Уведомление о присоединении нового пользователя */
    USER_JOINED = 'user_joined',

    /** Уведомление об уходе пользователя */
    USER_LEFT = 'user_left',

    /** Подключение транспорта WebRTC */
    CONNECT_TRANSPORT = 'connectTransport',

    /** Начало передачи медиапотока (аудио или видео) */
    PRODUCE = 'produce',

    /** Получение медиапотока от другого участника */
    CONSUME = 'consume',

    /** Приостановка получения медиапотока */
    PAUSE_CONSUMER = 'pauseConsumer',

    /** Возобновление получения медиапотока */
    RESUME_CONSUMER = 'resumeConsumer',

    /** Установка предпочтительных слоев для SVC видео */
    SET_PREFERRED_LAYERS = 'setPreferredLayers',

    /** Уведомление о новом производителе медиапотока */
    NEW_PRODUCER = 'newProducer'
}

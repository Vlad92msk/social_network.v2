export enum VideoConferenceEvents {
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
    NEW_PRODUCER = 'newProducer',

    /** Начало демонстрации экрана */
    START_SCREEN_SHARE = 'start_screen_share',

    /** Уведомление о начале демонстрации экрана */
    SCREEN_SHARE_STARTED = 'screen_share_started',

    /** Остановка демонстрации экрана */
    STOP_SCREEN_SHARE = 'stop_screen_share',

    /** Уведомление об остановке демонстрации экрана */
    SCREEN_SHARE_STOPPED = 'screen_share_stopped',

    /** Установка качества видео */
    SET_VIDEO_QUALITY = 'set_video_quality',

    /** Уведомление об изменении качества видео */
    VIDEO_QUALITY_CHANGED = 'video_quality_changed',

    /** Начало конференции */
    CONFERENCE_STARTED = 'conference_started',

    /** Завершение конференции */
    CONFERENCE_ENDED = 'conference_ended'
}

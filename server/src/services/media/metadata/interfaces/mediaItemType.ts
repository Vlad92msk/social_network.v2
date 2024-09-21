/**
 * @summary Тип файла
 * @enum {string}
 * @variation audio - аудио
 * @variation video - видео
 * @variation image - фотография
 * @variation voice - аудио-сообщение
 * @variation shorts - короткое видео
 * @variation other - все кроме аудио, видео и фотографии
 * */
export enum MediaItemType {
    AUDIO='audio',
    VIDEO = 'video',
    IMAGE = 'image',
    OTHER = 'other',
    VOICE = 'voice',
    SHORTS = 'shorts',
}

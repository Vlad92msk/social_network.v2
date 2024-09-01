import { SortDirection } from 'typeorm'

interface SortBy <T> {
    sort_by: keyof T;
    sort_direction: SortDirection;
}

interface Pagination {
    /**
     * Номер страницы
     * @format int32
     * @default 1
     */
    page?: number
    /**
     * Количество записей на страницы
     * @format int32
     * @default 50
     */
    per_page?: number
}

/**
 * Параметры, которые передаются через cookie
 */
interface RequestParams {
    profile_id: number
    user_info_id: string | number
}

/**
 * @summary Получить информацию о профиле
 * @description Если пользователь существует - вернет его, если нет - создаст новый профиль и вернет его
 * @request POST:/api/profile
 * @response `200` `ProfileInfo` OK
 */
type GetProfile = (data: string) => Promise<ProfileInfo>
/**
 * @summary Получить информацию о пользователе / канале
 * @request GET:/api/profile/{profile_id}
 * @response `200` `ProfileInfo` OK
 */
type GetUserInfo = (profile_id: number) => Promise<UserInfo>


interface UpdateUserInfoInput extends Omit<UserInfo, 'id'> {
}
/**
 * @summary Обновить информацию о пользователе / канале
 * @request PUT:/api/profile/{profile_id}
 * @response `200` `UserInfo` - обновленная информация о пользователе / канале
 */
type UpdateUserInfo = (data: UpdateUserInfoInput, requestParams: RequestParams) => Promise<UserInfo>


//==================================================
//========= Посты =========


interface GetPostsQuery extends Pagination {
    ids: string[]
}
/**
 * @summary Получить посты
 * @request GET:/api/posts/{user_info_id}
 * @response `200` `Post[]` OK
 */
type GetPosts = (query: GetPostsQuery, requestParams: RequestParams) => Promise<Post[]>
/**
 * @summary Получить пост по ID
 * @request GET:/api/post/{post_id}
 * @response `200` `Post]` OK
 */
type GetPostById = (post_id: number | string, requestParams: RequestParams) => Promise<Post>


interface CreatePostInput extends Pick<Publication, 'text' | 'videos' | 'voices' | 'media' | 'title'>{
}
/**
 * @summary Создать пост
 * @request POST:/api/post
 * @response `200` `Post` OK
 */
type CreatePost = (data: CreatePostInput) => Promise<Post>
/**
 * @summary Удалить пост
 * @request DELETE:/api/post/{post_id}
 * @response `200` `number | string`  - ID удаленного поста
 */
type DeletePost = (post_id: number | string, requestParams: RequestParams) => Promise<number | string>

interface UpdatePostInput extends Pick<Publication, 'text' | 'videos' | 'voices' | 'media' | 'title'>{
}
/**
 * @summary Обновить пост
 * @request PUT:/api/post/{post_id}
 * @response `200` `Post`  - обновленная версия поста
 */
type UpdatePost = (post_id: number | string, query: UpdatePostInput, requestParams: RequestParams) => Promise<Post>


//==================================================
//========= Диалоги =========

interface GetDialogsInput extends Pagination {
    ids: string[]
}
/**
 * @summary Получить диалоги
 * @request GET:/api/dialogs
 * @response `200` `DialogShort[]`  - обновленная версия поста
 */
type GetDialogs = (query: GetDialogsInput, requestParams: RequestParams) => Promise<DialogShort[]>
/**
 * @summary Получить диалог по ID
 * @description Ответ получит только тот пользователь который находится в массиве участников.
 * @request GET:/api/dialogs/{dialog_id}
 * @response `200` `Dialog`  - обновленная версия поста
 */
type GetDialogById = (dialog_id: string, requestParams: RequestParams) => Promise<Dialog>

interface CreateDialogInput {
    /* UserInfo.id пользователя с которым создается диалог */
    target_user_id?: string
}
/**
 * @summary Создать диалог
 * @description Если есть target_user_id то создается Транзакция. Диалог создается одним из двух способов. Первый способ - когда один пользователь написал другому - создается диалог у которого type = 'private', а в поле admins добавляются оба пользователя. Второй способ - это создание диалога "вручную", когда пользователь нажимает кнопку "Создать диалог". В этом случае type тоже будет 'private', но admins будет только UserInfo того пользователя который создал диалог. В обоих случаях в participants добавляются все пользователи участвующие в создании диалога.
 * @request POST:/api/dialogs
 * @response `200` `Dialog`  - обновленная версия поста. Создается, в том числе у второго пользователя (target_user_id)
 */
type CreateDialogs = (query: CreateDialogInput, requestParams: RequestParams) => Promise<Dialog>

interface UpdateDialogInput extends Pick<Dialog, 'type' | 'image' | 'title' | 'description'>{
}
/**
 * @summary Обновить информацию о диалоге
 * @description Может сделать только тот пользователь который является одним из администраторов
 * @request PUT:/api/dialogs/{dialog_id}
 * @response `200` `Dialog`  - обновленная версия диалога
 */
type UpdateDialogs = (dialog_id: string | number, query: UpdateDialogInput, requestParams: RequestParams) => Promise<Dialog>

/**
 * @summary Добавить пользователя в существующий диалог
 * @description Может сделать только тот пользователь, который является одним из администраторов. В массив participants добавляется UserInfo пользователя с id = invite_user_id
 * @request PUT:/api/dialogs/{dialog_id}/invite_participant
 * @response `200` `Dialog`  - обновленная версия диалога
 */
type InviteUserIntoDialog = (dialog_id: string | number, invite_user_id: string, requestParams: RequestParams) => Promise<Dialog>
/**
 * @summary Удалить пользователя из диалога
 * @description Может сделать только тот пользователь, который является одним из администраторов. Из массива participants удаляется UserInfo пользователя с id = invite_user_id
 * @request PUT:/api/dialogs/{dialog_id}/remove_participant
 * @response `200` `void`  OK
 */
type DeleteUserIntoDialog = (dialog_id: string | number, remove_user_id: string, requestParams: RequestParams) => Promise<void>
/**
 * @summary Сделать одного из участников диалога администратором
 * @description Может сделать только тот пользователь, который является одним из администраторов. В массив admins добавляется UserInfo пользователя с id = target_user_id
 * @request PUT:/api/dialogs/{dialog_id}/invite_admin
 * @response `200` `Dialog`  - обновленная версия диалога
 */
type AddAdminUserIntoDialog = (dialog_id: string | number, target_user_id: string, requestParams: RequestParams) => Promise<Dialog>
/**
 * @summary Покинуть диалог
 * @description Пользователь покинувший диалог удаляется из admins (если он там есть) и из participants. Если диалог покинули все участники (participants) - удаляется весь диалог со всеми данными которые к нему относятся.
 * @request PUT:/api/dialogs/{dialog_id}/leave
 * @response `200` `Dialog`  - обновленная версия диалога
 */
type LeaveFromDialog = (dialog_id: string | number, requestParams: RequestParams) => Promise<Dialog>
/**
 * @summary Очистить историю диалога
 * @description Может сделать только тот пользователь, который является одним из администраторов. Удаляются все данные которые относятся к переписке (сообщения, медиа, ссылки)
 * @request PUT:/api/dialogs/{dialog_id}/clear_history
 * @response `200` `Dialog`  - обновленная версия диалога
 */
type ClearHistoryDialog = (dialog_id: string | number, requestParams: RequestParams) => Promise<Dialog>
/**
 * @summary Добавить выбранное сообщение в массив закрепленных сообщений
 * @description Может сделать только тот пользователь, который является одним из администраторов.
 * @request PUT:/api/dialogs/{dialog_id}/fix_message
 * @response `200` `Dialog`  - обновленная версия диалога
 */
type AddFixMessageToDialog = (dialog_id: string | number, message_id: string, requestParams: RequestParams) => Promise<Dialog>
/**
 * @summary Удалить выбранное сообщение из массива закрепленных сообщений
 * @description Может сделать только тот пользователь, который является одним из администраторов.
 * @request PUT:/api/dialogs/{dialog_id}/fix_message
 * @response `200` `Dialog`  - обновленная версия диалога
 */
type RemoveFixMessageToDialog = (dialog_id: string | number, message_id: string, requestParams: RequestParams) => Promise<Dialog>



//==================================================
//========= Сообщения =========

interface CreateMessageInput extends Pick<Message, 'forward_message_id' | 'media' | 'text' | 'voices' |'videos'> {
    dialog_id: string
}
interface CreateMessageResponse extends Message {}
/**
 * @summary Создание сообщения
 * @description Каждое сообщение всегда должно относиться к тому диалогу в котором оно создано
 * @request POST:/api/messages
 * @response `200` `Message`  - созданное сообщение
 */
type CreateMessage = (data: CreateMessageInput, requestParams: RequestParams) => Promise<CreateMessageResponse>



interface GetMessagesInput extends Pagination {
    dialog_id: string
    ids: string[]
}
interface GetMessagesResponse extends Message {}
/**
 * @summary Получить массив сообщений
 * @request GET:/api/messages
 * @response `200` `GetMessagesResponse[]`  - массив сообщений в данном диалоге
 */
type GetMessages = (query: GetMessagesInput, requestParams: RequestParams) => Promise<GetMessagesResponse[]>

interface GetMessageByIdInput extends Pagination {
    dialog_id: string
    message_id: string
}
interface GetMessagesResponse extends Message {}
/**
 * @summary Получить сообщение по ID
 * @request GET:/api/messages/{dialog_id}/{message_id}
 * @response `200` `GetMessagesResponse`  - сообщение в данном диалоге
 */
type GetMessageById = (query: GetMessageByIdInput, requestParams: RequestParams) => Promise<GetMessagesResponse>


interface UpdateMessageInput {
    dialog_id: string
    message_id: string
}
interface UpdateMessageResponse extends Message {}
interface UpdateMessageData extends Pick<Message, 'media' | 'text' | 'voices' |'videos'> {}
/**
 * @summary Редактировать сообщение
 * @request PUT:/api/messages/{dialog_id}/{message_id}
 * @response `200` `GetMessagesResponse`  - обновленное сообщение
 */
type UpdateMessage = (query: UpdateMessageInput, data: UpdateMessageData, requestParams: RequestParams) => Promise<UpdateMessageResponse>

/**
 * @summary Удалить сообщение
 * @request DELETE:/api/messages/{dialog_id}/{message_id}
 * @response `200` `void`  - OK
 */
type DeleteMessage = (dialog_id: string, message_id: string, requestParams: RequestParams) => Promise<void>



//==================================================
//========= Комментарии =========


interface CreateCommentaryInput extends Pick<Commentary, 'text'>{
}

/**
 * @summary Создать комментарий
 * @request POST:/api/comments/{module}
 * @response `200` `Commentary`  - Комментарий
 */
type CreateCommentary = (module: 'post' | 'video' | 'music' | 'photo', data: CreateCommentaryInput, requestParams: RequestParams) => Promise<Commentary>

/**
 * @summary Получить комментарий по ID
 * @request GET:/api/comments/{module}/{id}
 * @response `200` `Commentary`  - Комментарий
 */
type GetCommentaryById = (module: 'post' | 'video' | 'music' | 'photo', id: string, requestParams: RequestParams) => Promise<Commentary>

interface PutCommentaryInput extends Pick<Commentary, 'text'> {
}
/**
 * @summary Редактировать комментарий
 * @request PUT:/api/comments/{module}/{id}
 * @response `200` `Commentary`  - Измененный комментарий
 */
type PutCommentary = (module: 'post' | 'video' | 'music' | 'photo', id: string, data: PutCommentaryInput, requestParams: RequestParams) => Promise<Commentary>

/**
 * @summary Удалить комментарий
 * @request DELETE:/api/comments/{module}/{id}
 * @response `200` `void`  - OK
 */
type DeleteCommentary = (module: 'post' | 'video' | 'music' | 'photo', id: string, requestParams: RequestParams) => Promise<void>

interface GetCommentaryInput extends Pagination, SortBy<Commentary> {
    /**
     * @summary Модуль (сущность) в котором хранятся комментарии
     * @description Пока что есть две сущности которые может публиковать пользователь - посты и медиа-файлы (фото, видео, аудио).
     * @enum {string}
     * @variation post - Посты
     * @variation media_item - медиа-файлы
     * */
    module: 'post' | 'media_item'
    /**
     * @summary Тип медиа элемента к которому относятся комментарии
     * @description Относится только к тем комментариям, у которых module = 'media_item'
     * @enum {string}
     * @variation video - видео
     * @variation music - аудио
     * @variation photo - фотографии
     * @variation other - все кроме видео, аудио и фото
     * */
    media_item_type?: MediaItemType
    ids: string[]
}
/**
 * @summary Получить комментарии
 * @request GET:/api/comments/{module}
 * @response `200` `Commentary[]`  - массив комментариев
 */
type GetCommentary = (query: GetCommentaryInput, requestParams: RequestParams) => Promise<Commentary[]>




//==================================================
//========= Медиа файлы =========

/**
 * @summary Загрузить медиа-файл
 * @description Работу с файлами будут осуществлять несколько сервисов:
 * metadata - отвечает за метаданные о медиа файлах (имя файла, путь к файлу, тип файла, дата загрузки и т.д.)
 * storage - отвечает за физическое хранение файлов в системе
 * aws - в дальнейшем хранение файлов будет перенесено из storage в aws или иное облачное хранилище
 * @request POST:/api/media
 * @response `200` `MediaItem`  - медиа-файл
 */
type UploadMediaItem = (metadata: FileObject[], requestParams: RequestParams) => Promise<MediaItem>

interface GetMediaItemInput extends Pick<MediaItem, 'type' | 'album_name' | 'author_id' | 'tags' | 'date_upload'>, Pagination, SortBy<MediaItem> {}
/**
 * @summary Получить медиа-файлы
 * @description Файлы будут храниться относительно ProfileInfo. То есть будет директория "uploads" внутри директории ProfileInfo. Внутри "uploads" будут директории по MediaItemType. В каждой директории будут храниться файлы соответствующего типа.
 * @request GET:/api/media/{type}
 * @response `200` `MediaItem[]`  - массив медиа-файлов
 */
type GetMediaItems = (query: GetMediaItemInput, requestParams: RequestParams) => Promise<MediaItem[]>

/**
 * @summary Получить медиа-файл по ID
 * @description Файлы будут храниться относительно ProfileInfo. То есть будет директория "uploads" внутри директории ProfileInfo. Внутри "uploads" будут директории по MediaItemType. В каждой директории будут храниться файлы соответствующего типа.
 * @request GET:/api/media/{type}/{id}
 * @response `200` `MediaItem`  - медиа-файл
 */
type GetMediaItemById = (type: MediaItemType, id: string | number, requestParams: RequestParams) => Promise<MediaItem>

/**
 * @summary Удалить медиа-файл по ID
 * @description удаляется сам файл физически, а так же вся информация связанная с ним. Если этот файл пересылался - он будет удален везде.
 * @request DELETE:/api/media/{type}/{id}
 * @response `200` `void`  - OK
 */
type DeleteMediaItemById = (type: MediaItemType, id: string | number, requestParams: RequestParams) => Promise<void>

interface UpdateMediaItemInput extends Pick<MediaItem, 'tags' | 'album_name' | 'users_check' > {}
/**
 * @summary Обновить информацию медиа-файл по ID
 * @description Обновляет общую информацию по файлу. Не касается мета-информации, расположения и других существенных атрибутов.
 * @request PUT:/api/media/{type}/{id}
 * @response `200` `MediaItem`  - медиа-файл
 */
type UpdateMediaItem = (type: MediaItemType, id: string | number, data: UpdateMediaItemInput, requestParams: RequestParams) => Promise<MediaItem>



//==================================================
//========= Интерфейсы =========


/**
 * @summary Общая информация о пользователе
 */
interface UserAbout {
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

/**
 * @summary Информация о пользователе / канале
 * @description
 */
interface UserInfo {
    id: number
     /** Публичный ID */
    public_id: string
     /** Имя */
    name: string
     /** Фото профиля */
    profile_image: string
     /** Общая информация о пользователе */
    about_info: UserAbout
     /** Массив ID постов */
    post_ids: string[]
     /** Массив ID видео */
    video_ids: string[]
     /** Массив ID фотографий */
    photo_ids: string[]
     /** Массив ID музыкальных треков */
    music_ids: string[]
     /** Массив ID контактов (друзей) */
    contact_ids: string[]
}

/**
 * @summary Информация о профиле
 */
interface ProfileInfo {
    id: number
     /** email */
    email: string
     /**
      * @summary Тип профиля
      * @enum {string}
      * @variation profile - пользователь
      * @variation channel - канал
      * */
    type: 'user' | 'channel'
     /** Информация о пользователе / канале */
    user_info: UserInfo
    /** Массив ID музыкальных диалогов */
    dialog_ids: string[]
}

/**
 * @summary emoji из 'emoji-picker-react'
 */
interface EmojiClickData {
    activeSkinTone: any;
    unified: string;
    unifiedWithoutSkinTone: string;
    emoji: string;
    names: string[];
    imageUrl: string;
    getImageUrl: any
    isCustom: boolean;
}

/**
 * @summary Реакция на публикацию
 */
interface PublicationReactions extends EmojiClickData {
    /** ID пользователя, который добавил реакцию */
    from_user_id: string
}

/**
 * @summary метаданные файла
 */
interface FileObject {
    name: string,
    src: string,
    type: string,
    size: number,
    lastModified: string,
    blob: Blob
}

/**
 * @summary Тип файла
 * @enum {string}
 * @variation audio - аудио
 * @variation video - видео
 * @variation image - фотография
 * @variation other - все кроме аудио, видео и фотографии
 * */
enum MediaItemType {
    AUDIO='audio',
    VIDEO = 'video',
    IMAGE = 'image',
    OTHER = 'other'
}

/**
 * @summary Медиа файл который пользователь загружает в систему
 */
interface MediaItem {
    id: number
    uuid: string
    /** метаданные файла */
    meta: FileObject
    /** ID автора, который загрузил этот файл */
    author_id: string
    /** Дата загрузки */
    date_upload: string
    /** Массив ID реакций */
    reaction_ids: string[]
    /** Массив ID отмеченных пользователей */
    users_check: string[]
    /** Массив тегов */
    tags: string[]
    /** Название альбома, если есть */
    album_name: string
    /**
     * @summary Тип файла
     * @enum {string}
     * @variation audio - аудио
     * @variation video - видео
     * @variation image - фотография
     * @variation other - все кроме аудио, видео и фотографии
     * */
    type: MediaItemType
}

/**
 * @summary Медиа файлы к публикации
 */
interface PublicationMedia {
    image: MediaItem[]
    audio: MediaItem[]
    video: MediaItem[]
    text: MediaItem[]
    other: MediaItem[]
}

/**
 * @summary Публикация
 * @description Общий тип.  в Буквальном смысле не используется нигде в самостоятельной форме. На основе "Публикации" будут построены такие интерфейсы как "Пост", "Сообщение", "Комментарий" и возможно что-то еще.
 */
interface Publication {
    id: number
    /** ID в виде строки так как их может быть очень много */
    uuid: string
    /** Текст */
    text: string
    /** Тип */
    type: 'post' | 'commentary' | 'message'
    /** Заголовок */
    title: string
    /** Массив голосовых сообщений */
    voices?: MediaItem[]
    /** Массив видео сообщений */
    videos?: MediaItem[]
    /** ID сущности на которое отвечает эта публикация */
    forward_message_id?: string
    /** Прикрепленные медиа-файлы */
    media: PublicationMedia
    /** Дата создания */
    date_created: Date
    /** Дата обновления */
    date_updated: Date
    /** Дата доставки */
    date_delivered: Date
    /** Дата прочтения */
    date_read: Date
    /** Автор */
    author?: UserInfo
    /** Массив ID комментариев */
    comment_ids?: string[]
    /** Массив реакций */
    reactions: PublicationReactions[]
}

/**
 * @summary Пост, который пользователь / канал может опубликовать
 */
type Post = Pick<Publication,
    'id'
    | 'title'
    | 'text'
    | 'reactions'
    | 'media'
    | 'voices'
    | 'videos'
    | 'comment_ids'
    | 'date_created'
    | 'date_updated'
    | 'author'
    | 'type'
>

/**
 * @summary Комментарий, который пользователь / канал может оставить
 */
type Commentary = Pick<Publication,
    'id'
    | 'text'
    | 'reactions'
    | 'date_created'
    | 'uuid'
    | 'author'
    | 'type'
>

/**
 * @summary Сообщение, которое пользователь / канал может отправить
 */
type Message = Pick<Publication,
    'id'
    | 'uuid'
    | 'text'
    | 'voices'
    | 'videos'
    | 'forward_message_id'
    | 'media'
    | 'date_created'
    | 'date_updated'
    | 'date_delivered'
    | 'date_read'
    | 'author'
    | 'reactions'
    | 'type'
>

/**
 * @summary Диалог который ведет пользователь с кем-то (Чат)
 */
interface Dialog {
    id: number
    uuid: string
    admins: UserInfo[]
    /** Фото */
    image: string
    /** Заголовок */
    title: string
    /** Массив ссылок которые есть в диалоге */
    links: string[]
    /** Массив документов которые есть в диалоге */
    document_ids: string[]
    /** Массив фотографий которые есть в диалоге */
    photo_ids: string[]
    /** Массив видео которые есть в диалоге */
    video_ids: string[]
    /** Массив сообщений которые закреплены в диалоге */
    fixed_messages?: Message[]
    /** Настройки */
    options: {
        /** Участники диалога не видят что текущий пользователь в online */
        hide_me?: boolean
        /** Включены ли уведомления о новых сообщениях */
        notify?: boolean
    }
    /** Описание */
    description?: string
    /** Тип (публичный(групповой) / приватный(личный)) */
    type?: 'private' | 'public'
    /** Массив ID пользователей-участников диалога */
    participants?: UserInfo[]
    /** Массив ID сообщений которые есть в диалоге */
    messages?: string[]
    /** Массив ID сообщений которые пользователь еще не прочитал */
    messages_not_read: string[]
    /** Последнее сообщение в диалоге */
    last_message?: Message
}

/**
 * @summary Короткая информация о диалоге который ведет пользователь
 */
type DialogShort = Pick<Dialog,
    'id'
    | 'uuid'
    | 'image'
    | 'title'
    | 'type'
    | 'messages_not_read'
    | 'last_message'
>


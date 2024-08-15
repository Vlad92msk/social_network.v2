import { MediaMetadata } from "../../metadata/entities/media-metadata.entity";
import { UserInfoType } from "@src/services/users/_interfaces";

/**
 * @summary Медиа файл который пользователь загружает в систему
 */
export interface MediaItem {
    id: string
    meta: MediaMetadata
    tagged_users: Omit<UserInfoType, 'about_info'>[]
    album_name: string
    comments_count: number

}

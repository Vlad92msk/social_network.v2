import { ApiProperty } from '@nestjs/swagger'
import { MediaMetadata } from '@services/media/metadata/entities/media-metadata.entity'
import { CalculateReactionsResponse } from '@services/reactions/dto/toggle-reaction-response.dto'
import { UserInfo } from '@services/users/user-info/entities'

export class MediaResponseDto {
    @ApiProperty({ description: 'Уникальный идентификатор медиа' })
    id: string

    @ApiProperty({ description: 'Название альбома', required: false, nullable: true })
    album_name: string

    @ApiProperty({ description: 'Дата создания записи' })
    created_at: Date

    @ApiProperty({ description: 'Дата последнего обновления записи' })
    updated_at: Date

    @ApiProperty({ description: 'Количество просмотров' })
    views_count: number

    @ApiProperty({ description: 'Количество комментариев' })
    comments_count: number

    @ApiProperty({ description: 'Мета-информация по файлу', type: () => MediaMetadata })
    meta: MediaMetadata

    @ApiProperty({ description: 'Автор загруженного файла', type: () => UserInfo })
    owner: UserInfo

    @ApiProperty({ description: 'Информация о реакциях', type: () => CalculateReactionsResponse })
    reaction_info: CalculateReactionsResponse
}

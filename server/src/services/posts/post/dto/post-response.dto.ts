import { PickType, ApiProperty } from '@nestjs/swagger'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { UserInfo } from '@services/users/user-info/entities'
import { FullType } from '@shared/types'
import { PostEntity, PostVisibility } from '../entities/post.entity'
import { CalculateReactionsResponse } from '@services/reactions/dto/toggle-reaction-response.dto'


export class PostResponseDto extends PickType(FullType(PostEntity), [
    'id',
    'text',
    'date_created',
    'date_updated',
    'author',
    'title',
    'count_views',
    'repost_count',
    'is_repost',
    'voices',
    'videos',
    'media',
    'visibility',
    'pinned',
    'location',
]) {
    @ApiProperty({ description: 'Уникальный идентификатор поста', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string

    @ApiProperty({ description: 'Текст поста', example: 'Текст моего поста' })
    text: string

    @ApiProperty({ description: 'Дата создания поста', type: 'string', format: 'date-time' })
    date_created: Date

    @ApiProperty({ description: 'Дата обновления поста', type: 'string', format: 'date-time' })
    date_updated: Date

    @ApiProperty({ description: 'Автор поста', type: () => UserInfo })
    author: UserInfo

    @ApiProperty({ description: 'Заголовок поста', example: 'Мой заголовок' })
    title: string

    @ApiProperty({ description: 'Количество просмотров', example: 100 })
    count_views: number

    @ApiProperty({ description: 'Количество репостов', example: 5 })
    repost_count: number

    @ApiProperty({ description: 'Является ли пост репостом', example: false })
    is_repost: boolean

    @ApiProperty({ description: 'Количество комментариев', example: 20 })
    comments_count: number

    @ApiProperty({ description: 'Голосовые вложения', type: () => [MediaEntity] })
    voices: MediaEntity[]

    @ApiProperty({ description: 'Видео вложения', type: () => [MediaEntity] })
    videos: MediaEntity[]

    @ApiProperty({ description: 'Медиа вложения', type: () => [MediaEntity] })
    media: MediaEntity[]

    @ApiProperty({ description: 'Уровень видимости поста', enum: PostVisibility, default: PostVisibility.PUBLIC })
    visibility: PostVisibility

    @ApiProperty({ description: 'Закреплен ли пост', example: false })
    pinned: boolean

    @ApiProperty({ description: 'Местоположение', example: 'Москва' })
    location: string

    @ApiProperty({ description: 'Информация о реакциях', type: () => CalculateReactionsResponse })
    reaction_info: CalculateReactionsResponse
}

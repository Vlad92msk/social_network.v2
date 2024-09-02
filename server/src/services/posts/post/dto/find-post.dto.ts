import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { PaginationAndSortingDto } from '@shared/dto'
import { IsArray, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator'
import { PostEntity } from '@services/posts/post/entities/post.entity'
import { ApiProperty } from '@nestjs/swagger'

export class FindPostDto extends IntersectionType(
    PartialType(PickType(PostEntity, [
        'id',
        'text',
        'title',
        'location',
        'pinned',
        'visibility',
        'count_views',
        'is_repost',
        'repost_count',
    ])),
    PaginationAndSortingDto<PostEntity>
) {
    @ApiProperty({ description: 'ID тегов для фильтрации', type: [String], required: false })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    tag_ids: string[]

    @ApiProperty({ description: 'Значение для поиска', required: false })
    @IsOptional()
    @IsString()
    value: string

    @ApiProperty({ description: 'Имя для поиска', required: false })
    @IsOptional()
    @IsString()
    name: string

    @ApiProperty({ description: 'Поисковый запрос', required: false })
    @IsOptional()
    @IsString()
    search: string

    @ApiProperty({
        description: 'Поле для сортировки',
        enum: ['id', 'text', 'title', 'location', 'pinned', 'visibility', 'count_views', 'is_repost', 'repost_count'],
        required: false
    })
    @IsString()
    @IsOptional()
    @IsIn([
        'id',
        'text',
        'title',
        'location',
        'pinned',
        'visibility',
        'count_views',
        'is_repost',
        'repost_count',
    ])
    sort_by:
        'id'
        | 'text'
        | 'title'
        | 'location'
        | 'pinned'
        | 'visibility'
        | 'count_views'
        | 'is_repost'
        | 'repost_count'
}

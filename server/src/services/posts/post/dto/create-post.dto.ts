import { IsString, IsOptional, IsBoolean, IsDate, IsEnum, IsUUID, IsArray } from 'class-validator'
import { PublicationType } from '@shared/entity/publication.entity'
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { PostEntity, PostVisibility } from '@services/posts/post/entities/post.entity'
import { ApiProperty } from '@nestjs/swagger'

export class CreatePostDto extends IntersectionType(
    PartialType(PickType(PostEntity, [
        'author', 'title', 'text', 'visibility',
        'is_repost',
        'original_post',
        'reply_to',
        'forwarded_post',
        'pinned',
        'location',
        'scheduled_publish_time',
    ])),
) {
    @ApiProperty({ description: 'Заголовок поста', required: false })
    @IsString()
    @IsOptional()
    title: string

    @ApiProperty({ description: 'Текст поста', required: false })
    @IsOptional()
    @IsString()
    text: string

    @ApiProperty({ description: 'Видимость поста', enum: PostVisibility, required: false })
    @IsEnum(PostVisibility)
    @IsOptional()
    visibility: PostVisibility

    @ApiProperty({ description: 'Является ли пост репостом', required: false })
    @IsBoolean()
    @IsOptional()
    is_repost: boolean

    @ApiProperty({ description: 'Оригинальный пост (для репоста)', type: () => PostEntity, required: false })
    @IsOptional()
    original_post: PostEntity

    @ApiProperty({ description: 'Пост, на который это ответ', type: () => PostEntity, required: false })
    @IsOptional()
    reply_to: PostEntity

    @ApiProperty({ description: 'Пересылаемый пост', type: () => PostEntity, required: false })
    @IsOptional()
    forwarded_post: PostEntity

    @ApiProperty({ description: 'ID медиафайлов', type: [String], required: false })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    media_ids: string[]

    @ApiProperty({ description: 'ID тегов', type: [String], required: false })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    tag_ids: string[]

    @ApiProperty({ description: 'Закрепить пост', required: false })
    @IsBoolean()
    @IsOptional()
    pinned: boolean

    @ApiProperty({ description: 'Местоположение', required: false })
    @IsString()
    @IsOptional()
    location: string

    @ApiProperty({ description: 'Время запланированной публикации', required: false })
    @IsDate()
    @IsOptional()
    scheduled_publish_time: Date

    @ApiProperty({ description: 'Тип публикации', enum: PublicationType, default: PublicationType.POST })
    @IsEnum(PublicationType)
    type: PublicationType = PublicationType.POST
}

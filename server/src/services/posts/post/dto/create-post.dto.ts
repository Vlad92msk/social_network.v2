import { IsString, IsOptional, IsBoolean, IsDate, IsEnum, IsUUID, IsArray } from 'class-validator'
import { PostVisibility, PublicationType } from '@shared/entity/publication.entity'
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { PostEntity } from '@services/posts/post/entities/post.entity'

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
    @IsString()
    @IsOptional()
    title: string

    @IsOptional()
    @IsString()
    text: string

    @IsEnum(PostVisibility)
    @IsOptional()
    visibility: PostVisibility

    @IsBoolean()
    @IsOptional()
    is_repost: boolean

    @IsOptional()
    original_post: PostEntity

    @IsOptional()
    reply_to: PostEntity

    @IsOptional()
    forwarded_post: PostEntity

    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    media_ids: string[]

    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    tag_ids: string[]

    @IsBoolean()
    @IsOptional()
    pinned: boolean

    @IsString()
    @IsOptional()
    location: string

    @IsDate()
    @IsOptional()
    scheduled_publish_time: Date

    @IsEnum(PublicationType)
    type: PublicationType = PublicationType.POST
}

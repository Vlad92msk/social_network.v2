import { IntersectionType, PartialType, PickType } from "@nestjs/mapped-types";
import { PaginationAndSortingDto } from "@shared/dto";
import { IsArray, IsEnum, IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import { PostEntity } from "@services/posts/post/entities/post.entity";

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
    @IsArray()
    @IsUUID("all", { each: true })
    @IsOptional()
    tag_ids: string[]

    @IsOptional()
    @IsString()
    value: string

    @IsOptional()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    search: string

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

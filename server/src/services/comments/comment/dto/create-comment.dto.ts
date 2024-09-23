import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator'
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { CommentEntity } from '../entities/comment.entity'
import { ApiProperty } from '@nestjs/swagger'

export class CreateCommentDto extends IntersectionType(
    PartialType(PickType(CommentEntity, [
        'author', 'text', 'post', 'media', 'is_pinned', 'parent_comment'
    ])),
) {
    @ApiProperty({ description: 'Текст комментария' })
    @IsString()
    text: string

    @ApiProperty({ description: 'Закрепить комментарий', required: false })
    @IsOptional()
    is_pinned: boolean

    @ApiProperty({ description: 'ID родительского комментария', required: false })
    @IsUUID()
    @IsOptional()
    parent_comment_id: string
}

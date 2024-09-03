import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator'
import { PublicationType } from '@shared/entity/publication.entity'
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

    @ApiProperty({ description: 'ID поста, к которому относится комментарий', required: false })
    @IsUUID()
    @IsOptional()
    post_id: string

    @ApiProperty({ description: 'ID медиафайла, к которому относится комментарий', required: false })
    @IsUUID()
    @IsOptional()
    media_id: string

    @ApiProperty({ description: 'Закрепить комментарий', required: false })
    @IsOptional()
    is_pinned: boolean

    @ApiProperty({ description: 'ID родительского комментария', required: false })
    @IsUUID()
    @IsOptional()
    parent_comment_id: string

    @ApiProperty({ description: 'Тип публикации', enum: PublicationType, default: PublicationType.COMMENTARY })
    type: PublicationType = PublicationType.COMMENTARY
}

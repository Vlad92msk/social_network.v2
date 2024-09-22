import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { PaginationAndSortingDto } from '@shared/dto'
import { IsOptional, IsString, IsUUID } from 'class-validator'
import { CommentEntity } from '../entities/comment.entity'
import { ApiProperty } from '@nestjs/swagger'

export class FindCommentDto extends IntersectionType(
    PartialType(PickType(CommentEntity, [
        'id',
        'text',
        'is_pinned',
    ])),
    PaginationAndSortingDto<CommentEntity>
) {
    @ApiProperty({ description: 'Поисковый запрос', required: false })
    @IsOptional()
    @IsString()
    search: string
}

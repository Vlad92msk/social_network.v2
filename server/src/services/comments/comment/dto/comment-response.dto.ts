import { ApiProperty, PickType, OmitType } from '@nestjs/swagger'
import { CommentEntity } from '../entities/comment.entity'

export class CommentWithChildCountDto extends OmitType(CommentEntity, ['post', 'media']) {
    @ApiProperty({ description: 'Количество дочерних комментариев' })
    child_count: number
}

export class CommentResponseDto {
    @ApiProperty({ type: [CommentWithChildCountDto] })
    data: CommentWithChildCountDto[]

    @ApiProperty({ description: 'Общее количество корневых комментариев' })
    total: number

    @ApiProperty({ description: 'Общее количество комментариев, включая дочерние' })
    totalComments: number
}

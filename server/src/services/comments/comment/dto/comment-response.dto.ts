import { ApiProperty } from '@nestjs/swagger'
import { CommentEntity } from '../entities/comment.entity'

export class CommentWithChildCountDto extends CommentEntity {
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

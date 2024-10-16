import { ApiProperty } from '@nestjs/swagger'
import { MessageEntity } from '../entity/message.entity'

export class MessagesResponseDto {
    @ApiProperty({ type: () => [MessageEntity] })
    data: MessageEntity[]

    @ApiProperty({ nullable: true })
    cursor: string

    @ApiProperty()
    total: number

    @ApiProperty()
    has_more: boolean
}

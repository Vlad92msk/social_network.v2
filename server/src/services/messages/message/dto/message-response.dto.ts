import { ApiProperty } from '@nestjs/swagger'

export class MessageResponseDto {
    @ApiProperty({ description: 'ID сообщения' })
    id: string

    @ApiProperty({ description: 'Текст сообщения' })
    text: string

    @ApiProperty({ description: 'ID автора сообщения' })
    author_id: string

    @ApiProperty({ description: 'Дата создания сообщения' })
    date_created: Date

    @ApiProperty({ description: 'Дата обновления сообщения' })
    date_updated: Date

    @ApiProperty({ description: 'ID сообщения, на которое отвечает данное сообщение', required: false })
    reply_to_id?: string

    @ApiProperty({ description: 'ID оригинального сообщения, если это пересылка', required: false })
    original_message_id?: string

    @ApiProperty({ description: 'Является ли сообщение пересланным' })
    is_forwarded: boolean

    @ApiProperty({ description: 'Количество пересылок сообщения' })
    forward_count: number

    @ApiProperty({ description: 'Дата получения сообщения', required: false })
    date_delivered?: Date

    @ApiProperty({ description: 'Дата прочтения сообщения', required: false })
    date_read?: Date

    @ApiProperty({ description: 'ID медиафайлов, прикрепленных к сообщению', type: [String] })
    media_ids: string[]
}

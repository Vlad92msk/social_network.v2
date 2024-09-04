import { ApiProperty } from '@nestjs/swagger'
import { MessageEntity } from '@services/messenger/message/entity/message.entity'

export class DialogShortDto {
    @ApiProperty({ description: 'Уникальный идентификатор диалога' })
    id: string

    @ApiProperty({ description: 'Заголовок диалога' })
    title: string

    @ApiProperty({ description: 'Фото диалога' })
    image: string

    @ApiProperty({ description: 'Тип диалога' })
    type: 'private' | 'public'

    @ApiProperty({ description: 'Последнее сообщение в диалоге' })
    last_message: MessageEntity | null

    @ApiProperty({ description: 'Количество непрочитанных сообщений' })
    unread_count: number
}

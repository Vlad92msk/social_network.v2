import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { MessageEntity } from '@services/messages/message/entity/message.entity'

@Entity({ name: 'dialog_short', comment: '' })
export class DialogShortEntity {
    @ApiProperty({ description: 'Уникальный идентификатор диалога' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Заголовок диалога' })
    @Column()
    title: string

    @ApiProperty({ description: 'Фото диалога' })
    @Column({ nullable: true })
    image: string

    @ApiProperty({ description: 'Тип диалога' })
    @Column({ type: 'enum', enum: ['private', 'public'] })
    type: 'private' | 'public'

    @ApiProperty({ description: 'Последнее сообщение в диалоге' })
    @ManyToOne(() => MessageEntity)
    @JoinColumn()
    last_message: MessageEntity

    @ApiProperty({ description: 'Количество непрочитанных сообщений' })
    @Column()
    unread_count: number
}

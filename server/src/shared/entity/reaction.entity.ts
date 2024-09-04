import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { MessageEntity } from '@services/messenger/message/entity/message.entity'
import { UserInfo } from '@services/users/user-info/entities'
import { ApiProperty } from '@nestjs/swagger'
import { CommentEntity } from '@services/comments/comment/entities/comment.entity'

@Entity({ name: 'reactions', comment: 'Реакции' })
export class ReactionEntity {
    @ApiProperty({ description: 'Уникальный идентификатор реакции' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Эмодзи реакции' })
    @Column()
    emoji: string

    @ApiProperty({ description: 'Сообщение, к которому относится реакция', type: () => CommentEntity })
    @ManyToOne(() => CommentEntity, comment => comment.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'comment_id' })
    comment: CommentEntity

    @ApiProperty({ description: 'Сообщение, к которому относится реакция', type: () => MessageEntity })
    @ManyToOne(() => MessageEntity, message => message.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'message_id' })
    message: MessageEntity

    @ApiProperty({ description: 'Пользователь, который оставил реакцию', type: () => UserInfo })
    @ManyToOne(() => UserInfo)
    @JoinColumn({ name: 'user_id' })
    user: UserInfo

    @ApiProperty({ description: 'Дата создания реакции' })
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date
}

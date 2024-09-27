import { ApiProperty } from '@nestjs/swagger'
import { CommentEntity } from '@services/comments/comment/entities/comment.entity'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { MessageEntity } from '@services/messenger/message/entity/message.entity'
import { PostEntity } from '@services/posts/post/entities/post.entity'
import { UserInfo } from '@services/users/user-info/entities'
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ReactionBaseEntity } from './reaction-base.entity'


@Entity({ name: 'reactions', comment: 'Реакции' })
export class ReactionEntity {
    @ApiProperty({ description: 'Уникальный идентификатор реакции', type: Number })
    @PrimaryGeneratedColumn()
    id: number

    // Когда вы запрашиваете ReactionEntity, связанная ReactionBaseEntity будет автоматически загружена вместе с ней,
    // без необходимости явно указывать это в запросе.
    @ApiProperty({ description: 'Объект реакции', type: () => ReactionBaseEntity })
    @ManyToOne(() => ReactionBaseEntity, { eager: true })
    @JoinColumn({ name: 'base_reaction_id' })
    reaction: ReactionBaseEntity

    @ApiProperty({ description: 'Пост, к которому относится реакция', type: () => PostEntity, nullable: true })
    @ManyToOne(() => PostEntity, post => post.reactions, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: PostEntity | null

    @ApiProperty({ description: 'Комментарий, к которому относится реакция', type: () => CommentEntity, nullable: true })
    @ManyToOne(() => CommentEntity, comment => comment.reactions, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'comment_id' })
    comment: CommentEntity | null

    @ApiProperty({ description: 'Сообщение, к которому относится реакция', type: () => MessageEntity, nullable: true })
    @ManyToOne(() => MessageEntity, message => message.reactions, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'message_id' })
    message: MessageEntity | null

    @ApiProperty({ description: 'Медиа-файл, к которому относится реакция', type: () => MediaEntity, nullable: true })
    @ManyToOne(() => MediaEntity, media => media.reactions, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'media_id' })
    media: MediaEntity | null

    @ApiProperty({ description: 'Пользователь, который оставил реакцию', type: () => UserInfo })
    @ManyToOne(() => UserInfo, user => user.reactions)
    @JoinColumn({ name: 'user_id' })
    user: UserInfo
}

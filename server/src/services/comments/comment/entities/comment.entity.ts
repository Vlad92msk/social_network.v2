import { ApiProperty } from '@nestjs/swagger'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { PostEntity } from '@services/posts/post/entities/post.entity'
import { ReactionEntity } from '@services/reactions/entities/reaction.entity'
import { PublicationEntity, PublicationType } from '@shared/entity/publication.entity'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'


@Entity({ name: 'comments', comment: 'Комментарии, которые пользователь может оставлять под те или иные сущности' })
export class CommentEntity extends PublicationEntity {
    @ApiProperty({ description: 'Закреплен ли комментарий', default: false, type: Boolean })
    @Column({ type: 'boolean', default: false, comment: 'Флаг для закрепления комментария' })
    is_pinned: boolean

    @ApiProperty({ description: 'Родительский комментарий', type: () => CommentEntity, required: false, nullable: true })
    @ManyToOne(() => CommentEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_comment_id' })
    parent_comment: CommentEntity | null

    @ApiProperty({ description: 'Реакции', type: () => [ReactionEntity] })
    @OneToMany(() => ReactionEntity, reaction => reaction.comment, { cascade: true, onDelete: 'CASCADE', nullable: true, lazy: true })
    reactions: ReactionEntity[]

    @ApiProperty({ description: 'Пост к которому относится комментарий', type: () => PostEntity, nullable: true })
    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: PostEntity | null

    @ApiProperty({ description: 'Медиа файл к которому относится комментарий', type: () => MediaEntity, nullable: true })
    @ManyToOne(() => MediaEntity, { nullable: true })
    @JoinColumn({ name: 'media_id' })
    media: MediaEntity | null

    constructor() {
        super()
        this.type = PublicationType.COMMENTARY
    }
}

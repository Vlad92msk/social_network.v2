import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { PublicationEntity, PublicationType } from '@shared/entity/publication.entity'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { ApiProperty } from '@nestjs/swagger'
import { ReactionEntity } from '@shared/entity/reaction.entity'
import { PostEntity } from '@services/posts/post/entities/post.entity'

@Entity({ name: 'comments', comment: 'Комментарии, которые пользователь может оставлять под те или иные сущности' })
export class CommentEntity extends PublicationEntity {
    @ApiProperty({ description: 'Закреплен ли комментарий', default: false })
    @Column({ type: 'boolean', default: false, comment: 'Флаг для закрепления комментария' })
    is_pinned: boolean

    @ApiProperty({ description: 'Родительский комментарий', type: () => CommentEntity, required: false })
    @ManyToOne(() => CommentEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_comment_id' })
    parent_comment: CommentEntity

    @ApiProperty({ description: 'Реакции', type: () => [ReactionEntity] })
    @OneToMany(() => ReactionEntity, reaction => reaction.message)
    reactions: ReactionEntity[]

    @ApiProperty({ description: 'Пост к которому относится комментарий', type: () => PostEntity })
    @ManyToOne(() => PostEntity, { nullable: true })
    @JoinColumn({ name: 'post_id' })
    post: PostEntity

    @ApiProperty({ description: 'Медиа файл к которому относится комментарий', type: () => MediaEntity })
    @ManyToOne(() => MediaEntity, { nullable: true })
    @JoinColumn({ name: 'media_id' })
    media: MediaEntity

    constructor() {
        super()
        this.type = PublicationType.COMMENTARY
    }
}

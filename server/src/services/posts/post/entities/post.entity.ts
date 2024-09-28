import { ReactionEntity } from '@services/reactions/entities/reaction.entity'
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm'
import { PublicationEntity, PublicationType } from '@shared/entity/publication.entity'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { Tag } from '@services/tags/entity'
import { ApiProperty } from '@nestjs/swagger'
import { CommentEntity } from '@services/comments/comment/entities/comment.entity'

export enum PostVisibility {
    PUBLIC = 'public',
    FRIENDS = 'friends',
    PRIVATE = 'private'
}

@Entity({ name: 'posts', comment: 'Посты, которые пользователи могут публиковать у себя на странице/канале' })
export class PostEntity extends PublicationEntity {
    @ApiProperty({ description: 'Заголовок поста', required: false, nullable: true })
    @Column({ nullable: true, type: 'varchar', length: 50, comment: 'Заголовок (если есть)' })
    title: string

    @ApiProperty({ description: 'Количество просмотров', default: 0 })
    @Column({ type: 'int', default: 0, comment: 'Количество просмотров' })
    count_views: number

    @ApiProperty({ description: 'Количество репостов', default: 0 })
    @Column({ type: 'int', default: 0, comment: 'Количество репостов' })
    repost_count: number

    @ApiProperty({ description: 'Является ли пост репостом', default: false })
    @Column({ type: 'boolean', default: false, comment: 'Является ли пост пересылкой' })
    is_repost: boolean

    @ApiProperty({ description: 'Оригинальный пост (если это репост)', type: () => PostEntity, required: false })
    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'original_post_id' })
    original_post: PostEntity

    @ApiProperty({ description: 'Репосты данного поста', type: () => [PostEntity] })
    @OneToMany(() => PostEntity, post => post.original_post)
    reposts: PostEntity[]

    @ApiProperty({ description: 'Пост, на который это ответ', type: () => PostEntity, required: false })
    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reply_to_id' })
    reply_to: PostEntity

    @ApiProperty({ description: 'Ответы на данный пост', type: () => [PostEntity] })
    @OneToMany(() => PostEntity, post => post.reply_to)
    replies: PostEntity[]

    @ApiProperty({ description: 'Пост, на которое отвечает данный пост', type: () => PostEntity, required: false })
    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'forward_id' })
    forwarded_post: PostEntity

    @ApiProperty({ description: 'Посты, которые являются ответами на данное сообщение', type: () => [PostEntity] })
    @OneToMany(() => PostEntity, message => message.forwarded_post)
    forwarded_to: PostEntity[]

    @ApiProperty({ description: 'Комментарии к данному посту', type: () => [CommentEntity] })
    @OneToMany(() => CommentEntity, comment => comment.post, { cascade: true, onDelete: 'CASCADE', nullable: true, lazy: true })
    comments: CommentEntity[]

    @ApiProperty({ description: 'Реакции', type: () => [ReactionEntity] })
    @OneToMany(() => ReactionEntity, reaction => reaction.post, { cascade: true, onDelete: 'CASCADE', nullable: true })
    reactions: ReactionEntity[]

    @ApiProperty({ description: 'Количество комментариев к посту', default: 0 })
    @Column({ type: 'int', default: 0, comment: 'Количество комментариев' })
    comment_count: number

    @ApiProperty({ description: 'Голосовые вложения', type: () => [MediaEntity] })
    @OneToMany(() => MediaEntity, media => media.voicePost)
    voices: MediaEntity[]

    @ApiProperty({ description: 'Видео вложения', type: () => [MediaEntity] })
    @OneToMany(() => MediaEntity, media => media.videoPost)
    videos: MediaEntity[]

    @ApiProperty({ description: 'Файлы, приложенные к посту', type: () => [MediaEntity] })
    @ManyToMany(() => MediaEntity, { onDelete: 'CASCADE' })
    @JoinTable({
        name: 'post_media',
        joinColumn: { name: 'post_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'media_id', referencedColumnName: 'id' },
    })
    media: MediaEntity[]

    @ApiProperty({ description: 'Теги, связанные с постом', type: () => [Tag] })
    @ManyToMany(() => Tag)
    @JoinTable({
        name: 'post_tags',
        joinColumn: { name: 'post_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    })
    tags: Tag[]

    @ApiProperty({ description: 'Был ли пост отредактирован', default: false })
    @Column({ type: 'boolean', default: false, comment: 'Флаг, показывающий, был ли пост отредактирован' })
    is_edited: boolean

    @ApiProperty({
        description: 'Уровень видимости поста',
        enum: PostVisibility,
        enumName: 'PostVisibility',
        default: PostVisibility.PUBLIC
    })
    @Column({
        type: 'enum',
        enum: PostVisibility,
        default: PostVisibility.PUBLIC,
        comment: 'Уровень видимости поста'
    })
    visibility: PostVisibility

    @ApiProperty({ description: 'Закреплен ли пост', default: false })
    @Column({ type: 'boolean', default: false, comment: 'Флаг для закрепления поста' })
    pinned: boolean

    @ApiProperty({ description: 'Местоположение, связанное с постом', required: false })
    @Column({ type: 'varchar', nullable: true, comment: 'Местоположение, связанное с постом' })
    location: string

    @ApiProperty({ description: 'Время запланированной публикации поста', required: false })
    @Column({ type: 'timestamp', nullable: true, comment: 'Время запланированной публикации поста' })
    scheduled_publish_time: Date

    constructor() {
        super()
        this.type = PublicationType.POST
    }
}

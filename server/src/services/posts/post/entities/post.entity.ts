import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm'
import { PostVisibility, PublicationEntity, PublicationType } from '@shared/entity/publication.entity'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { Tag } from '@services/tags/entity'

@Entity({ name: 'posts', comment: 'Посты, которые пользователи могут публиковать у себя на странице/канале' })
export class PostEntity extends PublicationEntity {
    @Column({ nullable: true, type: 'varchar', length: 50, comment: 'Заголовок (если есть)' })
    title: string

    @Column({ type: 'int', default: 0, comment: 'Количество просмотров' })
    count_views: number

    @Column({ type: 'int', default: 0, comment: 'Количество репостов' })
    repost_count: number

    @Column({ type: 'boolean', default: false, comment: 'Является ли пост пересылкой' })
    is_repost: boolean

    /**
     * Ссылка на оригинальный пост, если текущий пост является репостом.
     * Позволяет отслеживать источник контента при репостах.
     */
    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'original_post_id' })
    original_post: PostEntity

    /**
     * Массив всех репостов данного поста.
     * Позволяет отслеживать, сколько раз и кем был репостнут данный пост.
     */
    @OneToMany(() => PostEntity, post => post.original_post)
    reposts: PostEntity[]

    /**
     * Ссылка на пост, на который данный пост является ответом.
     * Используется для создания древовидной структуры обсуждений.
     */
    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reply_to_id' })
    reply_to: PostEntity

    /**
     * Массив всех постов, которые являются ответами на данный пост.
     * Позволяет легко получить все ответы на конкретный пост.
     */
    @OneToMany(() => PostEntity, post => post.reply_to)
    replies: PostEntity[]

    /**
     * Указывает на пост, на которое отвечает данный пост
     */
    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'forward_id' })
    forwarded_post: PostEntity

    /**
     * Cодержит массив всех постов, которые являются ответами на данное сообщение
     */
    @OneToMany(() => PostEntity, message => message.forwarded_post)
    forwarded_to: PostEntity[]

    /**
     * Голосовые вложения
     */
    @OneToMany(type => MediaEntity, publication => publication.voicesRef)
    voices: MediaEntity[]

    /**
     * Видео вложения
     */
    @OneToMany(type => MediaEntity, publication => publication.videosRef)
    videos: MediaEntity[]

    /**
     * Файлы приложенные к посту
     */
    @ManyToMany(() => MediaEntity, { onDelete: 'CASCADE' })
    @JoinTable({
        name: 'post_media',
        joinColumn: { name: 'post_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'media_id', referencedColumnName: 'id' },
    })
    media: MediaEntity[]

    /**
     * Теги, связанные с постом
     */
    @ManyToMany(() => Tag)
    @JoinTable({
        name: 'post_tags',
        joinColumn: { name: 'post_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    })
    tags: Tag[]

    @Column({ type: 'boolean', default: false, comment: 'Флаг, показывающий, был ли пост отредактирован' })
    is_edited: boolean

    @Column({ type: 'enum', enum: PostVisibility, default: PostVisibility.PUBLIC, comment: 'Уровень видимости поста' })
    visibility: PostVisibility

    @Column({ type: 'boolean', default: false, comment: 'Флаг для закрепления поста' })
    pinned: boolean

    @Column({ type: 'varchar', nullable: true, comment: 'Местоположение, связанное с постом' })
    location: string

    @Column({ type: 'timestamp', nullable: true, comment: 'Время запланированной публикации поста' })
    scheduled_publish_time: Date

    constructor() {
        super()
        this.type = PublicationType.POST
    }
}

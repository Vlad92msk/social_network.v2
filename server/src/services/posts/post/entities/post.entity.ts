import { Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, JoinTable } from "typeorm";
import { PublicationEntity, PublicationType } from "@shared/entity/publication.entity";
import { MediaEntity } from "@services/media/info/entities/media.entity";

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

    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'original_post_id' })
    original_post: PostEntity

    @OneToMany(() => PostEntity, post => post.original_post)
    reposts: PostEntity[]

    @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reply_to_id' })
    reply_to: PostEntity

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
    forwarded_to: PostEntity[];

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


    constructor() {
        super()
        this.type = PublicationType.POST
    }
}

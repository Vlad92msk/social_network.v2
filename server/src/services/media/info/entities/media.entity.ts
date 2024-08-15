import {
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne, Index
} from "typeorm";
import { MediaItem } from "../interfaces/media-item";
import { MediaMetadata } from "../../metadata/entities/media-metadata.entity";
import { UserInfo } from "@src/services/users/user/entities";
import { JoinTable } from "typeorm/browser";
import { Tag } from "@src/services/tags/entity";
import { CommentEntity } from "@services/comments/comment/entities/comment.entity";
import { MessageEntity } from "@services/messages/message/entity/message.entity";

@Entity({ name: 'media', comment: 'Общая информация о файле, который пользователь загружает в систему' })
export class MediaEntity implements MediaItem {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: true, type: 'varchar', length: 50, comment: 'Название альбома, если есть' })
    album_name: string

    @CreateDateColumn({ nullable: false, comment: 'Дата создания записи' })
    created_at: Date

    @UpdateDateColumn({ nullable: true, comment: 'Дата последнего обновления записи' })
    updated_at: Date

    @Column({ type: 'int', default: 0, comment: 'Количество просмотров' })
    views_count: number

    @Column({ type: 'int', default: 0, comment: 'Количество комментариев' })
    comments_count: number

    // Связи

    /**
     * Мета-информация по файлу
     */
    @OneToOne(() => MediaMetadata, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'metadata_id', referencedColumnName: 'id' })
    meta: MediaMetadata;

    /**
     * Автор загруженного файла
     */
    @Index() // Добавляем индекс для быстрого поиска по владельцу
    @ManyToOne(() => UserInfo)
    @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
    owner: UserInfo;

    /**
     * Отмеченные пользователи
     */
    @Index() // Добавляем индекс для быстрого поиска отмеченных пользователей
    @ManyToMany(() => UserInfo)
    @JoinTable({
        name: 'media_tagged_users',
        joinColumn: { name: 'media_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    })
    tagged_users: UserInfo[];

    /**
     * Тэги
     */
    @ManyToMany(() => Tag)
    @JoinTable({
        name: 'media_tags',
        joinColumn: { name: 'media_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    })
    tags: Tag[];

    /**
     * Комментарии к данному медиа
     */
    @Index() // Добавляем индекс для быстрого поиска комментариев
    @OneToMany(() => CommentEntity, comment => comment.mediaRef, { cascade: true, onDelete: 'CASCADE', nullable: true, lazy: true })
    comments: CommentEntity[];

    //
    //
    // ________________
    // Обратные связи

    /**
     * К каким сообщениям добавлен медиа-файл
     */
    @Index()
    @ManyToMany(() => MessageEntity, message => message.media, { cascade: true, onDelete: 'CASCADE', lazy: true })
    messagesRef: MessageEntity[]

    /**
     * Обратная ссылка на сообщение к которому относится данный медиа-файл (аудио сообщение)
     */
    @Index()
    @ManyToOne(() => MessageEntity, message => message.voices, { cascade: true, onDelete: 'CASCADE', lazy: true })
    @JoinColumn({ name: 'added_voice_id' })
    voicesRef: MessageEntity

    /**
     * Обратная ссылка на сообщение к которому относится данный медиа-файл (видео сообщение)
     */
    @Index()
    @ManyToOne(() => MessageEntity, message => message.videos, { cascade: true, onDelete: 'CASCADE', lazy: true })
    @JoinColumn({ name: 'added_video_id' })
    videosRef: MessageEntity
}

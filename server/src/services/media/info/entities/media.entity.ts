import { PostEntity } from '@services/posts/post/entities/post.entity'
import { ReactionEntity } from '@services/reactions/entities/reaction.entity'
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
    ManyToOne,
    JoinTable
} from 'typeorm'
import { MediaItem } from '../interfaces/media-item'
import { MediaMetadata } from '../../metadata/entities/media-metadata.entity'
import { UserInfo } from '@services/users/user-info/entities'
import { Tag } from '@src/services/tags/entity'
import { CommentEntity } from '@services/comments/comment/entities/comment.entity'
import { MessageEntity } from '@services/messenger/message/entity/message.entity'
import { ApiProperty } from '@nestjs/swagger'


@Entity({ name: 'media', comment: 'Общая информация о файле, который пользователь загружает в систему' })
export class MediaEntity implements MediaItem {
    @ApiProperty({ description: 'Уникальный идентификатор медиа' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Название альбома', required: false, nullable: true })
    @Column({ nullable: true, type: 'varchar', length: 50, comment: 'Название альбома, если есть' })
    album_name: string

    @ApiProperty({ description: 'Дата создания записи' })
    @CreateDateColumn({ nullable: false, comment: 'Дата создания записи' })
    created_at: Date

    @ApiProperty({ description: 'Дата последнего обновления записи' })
    @UpdateDateColumn({ nullable: true, default: null, comment: 'Дата последнего обновления записи' })
    updated_at: Date

    @ApiProperty({ description: 'Количество просмотров' })
    @Column({ type: 'int', default: 0, comment: 'Количество просмотров' })
    views_count: number

    @ApiProperty({ description: 'Количество комментариев' })
    @Column({ type: 'int', default: 0, comment: 'Количество комментариев' })
    comments_count: number

    @ApiProperty({ description: 'Мета-информация по файлу', type: () => MediaMetadata })
    @OneToOne(() => MediaMetadata, { cascade: true, onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'metadata_id', referencedColumnName: 'id' })
    meta: MediaMetadata

    @ApiProperty({ description: 'Автор загруженного файла', type: () => UserInfo })
    @ManyToOne(() => UserInfo, { eager: true })
    @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
    owner: UserInfo

    @ApiProperty({ description: 'Отмеченные пользователи', type: () => [UserInfo] })
    @ManyToMany(() => UserInfo)
    @JoinTable({
        name: 'media_tagged_users',
        joinColumn: { name: 'media_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    })
    tagged_users: UserInfo[]

    @ApiProperty({ description: 'Тэги', type: () => [Tag] })
    @ManyToMany(() => Tag, (tag) => tag.media, { cascade: true })
    @JoinTable({
        name: 'media_tags',
        joinColumn: { name: 'media_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    })
    tags: Tag[]

    @ApiProperty({ description: 'Реакции', type: () => [ReactionEntity], nullable: true })
    @OneToMany(() => ReactionEntity, reaction => reaction.media, { cascade: true, onDelete: 'CASCADE', nullable: true })
    reactions: ReactionEntity[]

    @ApiProperty({ description: 'Комментарии к данному медиа', type: () => [CommentEntity], nullable: true })
    @OneToMany(() => CommentEntity, comment => comment.media, { cascade: true, onDelete: 'CASCADE', nullable: true, lazy: true })
    comments: CommentEntity[]

    @ApiProperty({ description: 'Сообщения, к которым добавлен медиа-файл', type: () => [MessageEntity], nullable: true })
    @ManyToMany(() => MessageEntity, message => message.media, { cascade: true, onDelete: 'CASCADE', lazy: true })
    messagesRef: MessageEntity[]

    @ApiProperty({ description: 'Сообщение, к которому относится данный медиа-файл (аудио сообщение)', type: () => MessageEntity, nullable: true })
    @ManyToOne(() => MessageEntity, message => message.voices, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_voice_id' })
    voiceMessage: MessageEntity

    @ApiProperty({ description: 'Сообщение, к которому относится данный медиа-файл (видео сообщение)', type: () => MessageEntity, nullable: true })
    @ManyToOne(() => MessageEntity, message => message.videos, { cascade: true, onDelete: 'CASCADE', lazy: true })
    @JoinColumn({ name: 'added_video_id' })
    videoMessage: MessageEntity

    @ApiProperty({ description: 'Пост, к которому относится данный медиа-файл (аудио вложение)', type: () => PostEntity, nullable: true })
    @ManyToOne(() => PostEntity, post => post.voices, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_voice_post_id' }) // Исправляем имя колонки для голоса
    voicePost: PostEntity

    @ApiProperty({ description: 'Пост, к которому относится данный медиа-файл (видео вложение)', type: () => PostEntity, nullable: true })
    @ManyToOne(() => PostEntity, post => post.videos, { cascade: true, onDelete: 'CASCADE', lazy: true })
    @JoinColumn({ name: 'added_video_post_id' }) // Исправляем имя колонки для видео
    videoPost: PostEntity
}

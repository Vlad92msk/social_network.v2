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
import { MessageEntity } from '@services/messages/message/entity/message.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity({ name: 'media', comment: 'Общая информация о файле, который пользователь загружает в систему' })
export class MediaEntity implements MediaItem {
    @ApiProperty({ description: 'Уникальный идентификатор медиа' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Название альбома', required: false })
    @Column({ nullable: true, type: 'varchar', length: 50, comment: 'Название альбома, если есть' })
    album_name: string

    @ApiProperty({ description: 'Дата создания записи' })
    @CreateDateColumn({ nullable: false, comment: 'Дата создания записи' })
    created_at: Date

    @ApiProperty({ description: 'Дата последнего обновления записи' })
    @UpdateDateColumn({ nullable: true, comment: 'Дата последнего обновления записи' })
    updated_at: Date

    @ApiProperty({ description: 'Количество просмотров' })
    @Column({ type: 'int', default: 0, comment: 'Количество просмотров' })
    views_count: number

    @ApiProperty({ description: 'Количество комментариев' })
    @Column({ type: 'int', default: 0, comment: 'Количество комментариев' })
    comments_count: number

    @ApiProperty({ description: 'Мета-информация по файлу', type: () => MediaMetadata })
    @OneToOne(() => MediaMetadata, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'metadata_id', referencedColumnName: 'id' })
    meta: MediaMetadata

    @ApiProperty({ description: 'Автор загруженного файла', type: () => UserInfo })
    @ManyToOne(() => UserInfo)
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

    @ApiProperty({ description: 'Комментарии к данному медиа', type: () => [CommentEntity] })
    @OneToMany(() => CommentEntity, comment => comment.media, { cascade: true, onDelete: 'CASCADE', nullable: true, lazy: true })
    comments: CommentEntity[]

    @ApiProperty({ description: 'Сообщения, к которым добавлен медиа-файл', type: () => [MessageEntity] })
    @ManyToMany(() => MessageEntity, message => message.media, { cascade: true, onDelete: 'CASCADE', lazy: true })
    messagesRef: MessageEntity[]

    @ApiProperty({ description: 'Сообщение, к которому относится данный медиа-файл (аудио сообщение)', type: () => MessageEntity })
    @ManyToOne(() => MessageEntity, message => message.voices, { cascade: true, onDelete: 'CASCADE', lazy: true })
    @JoinColumn({ name: 'added_voice_id' })
    voicesRef: MessageEntity

    @ApiProperty({ description: 'Сообщение, к которому относится данный медиа-файл (видео сообщение)', type: () => MessageEntity })
    @ManyToOne(() => MessageEntity, message => message.videos, { cascade: true, onDelete: 'CASCADE', lazy: true })
    @JoinColumn({ name: 'added_video_id' })
    videosRef: MessageEntity
}

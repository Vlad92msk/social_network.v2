import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { UserInfo } from '@services/users/user-info/entities'
import { MediaItem } from '@services/media/info/interfaces/media-item'

export enum PublicationType {
    POST='post',
    COMMENTARY='commentary',
    MESSAGE='message',
}
export enum PostVisibility {
    PUBLIC = 'public',
    FRIENDS = 'friends',
    PRIVATE = 'private'
}

/**
 * @summary Публикация
 * @description Общий тип.  в Буквальном смысле не используется нигде в самостоятельной форме. На основе "Публикации" будут построены такие интерфейсы как "Пост", "Сообщение", "Комментарий" и возможно что-то еще.
 */
@Entity({ name: 'publication', comment: 'Общий тип.  в Буквальном смысле не используется нигде в самостоятельной форме. На основе "Публикации" будут построены такие интерфейсы как "Пост", "Сообщение", "Комментарий" и возможно что-то еще.' })
export abstract class PublicationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'text', nullable: false, comment: 'Текст' })
    text: string

    @Column({ type: 'enum', enum: PublicationType, comment: 'Тип публикации' })
    type: PublicationType

    @CreateDateColumn({ comment: 'Дата создания' })
    date_created: Date

    @UpdateDateColumn({ comment: 'Дата обновления' })
    date_updated: Date

    /**
     * Автор данного комментария/поста/сообщения
     */
    @ManyToOne(() => UserInfo)
    @JoinColumn({ name: 'author_id' })
    author: UserInfo
}


import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { UserInfo } from "@services/users/user/entities";
import { MediaItem } from "@services/media/info/interfaces/media-item";

export enum PublicationType {
    POST='post',
    COMMENTARY='commentary',
    MESSAGE='message',
}

/**
 * @summary Медиа файлы к публикации
 */
interface PublicationMedia {
    image: MediaItem[]
    audio: MediaItem[]
    video: MediaItem[]
    text: MediaItem[]
    other: MediaItem[]
}

/**
 * @summary Публикация
 * @description Общий тип.  в Буквальном смысле не используется нигде в самостоятельной форме. На основе "Публикации" будут построены такие интерфейсы как "Пост", "Сообщение", "Комментарий" и возможно что-то еще.
 */
@Entity({ name: 'publication', comment: 'Общий тип.  в Буквальном смысле не используется нигде в самостоятельной форме. На основе "Публикации" будут построены такие интерфейсы как "Пост", "Сообщение", "Комментарий" и возможно что-то еще.' })
export abstract class PublicationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number

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


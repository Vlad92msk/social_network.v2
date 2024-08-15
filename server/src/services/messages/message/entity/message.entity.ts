import { Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { PublicationEntity, PublicationType } from "@shared/entity/publication.entity";
import { MediaEntity } from "@services/media/info/entities/media.entity";
import { JoinTable } from "typeorm/browser";

@Entity({ name: 'messages', comment: 'Сообщения, которыми пользователи могут обмениваться в диалоге' })
export class MessageEntity extends PublicationEntity {
    /**
     * Указывает на сообщение, на которое отвечает данное сообщение
     */
    @ManyToOne(() => MessageEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reply_to_id' })
    reply_to: MessageEntity

    /**
     * Содержит массив всех сообщений, которые являются ответами на данное сообщение
     */
    @OneToMany(() => MessageEntity, message => message.reply_to)
    replies: MessageEntity[]

    /**
     * Указывает на оригинальное сообщение, если данное сообщение является пересланным
     */
    @ManyToOne(() => MessageEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'original_message_id' })
    original_message: MessageEntity

    /**
     * Содержит массив всех пересылок данного сообщения
     */
    @OneToMany(() => MessageEntity, message => message.original_message)
    forwards: MessageEntity[]

    @Column({ type: 'boolean', default: false, comment: 'Является ли сообщение пересланным' })
    is_forwarded: boolean

    @Column({ type: 'int', default: 0, comment: 'Количество пересылок сообщения' })
    forward_count: number

    @Column({ nullable: true, type: 'timestamp', comment: 'Дата получения сообщения (обновляется когда сообщение дошло до пользователя)' })
    date_delivered: Date

    @Column({ nullable: true, type: 'timestamp', comment: 'Дата прочтения сообщения (обновляется когда сообщение было открыто пользователем)' })
    date_read: Date

    /**
     * Голосовые сообщения
     */
    @OneToMany(type => MediaEntity, publication => publication.voicesRef)
    voices: MediaEntity[]

    /**
     * Видео сообщения
     */
    @OneToMany(type => MediaEntity, publication => publication.videosRef)
    videos: MediaEntity[]

    /**
     * Файлы приложенные к сообщению
     */
    @Index()
    @ManyToMany(() => MediaEntity, { onDelete: 'CASCADE' })
    @JoinTable({
        name: 'message_media',
        joinColumn: { name: 'message_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'media_id', referencedColumnName: 'id' },
    })
    media: MediaEntity[]


    constructor() {
        super()
        this.type = PublicationType.MESSAGE
    }
}

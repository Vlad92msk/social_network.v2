import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, JoinTable, OneToOne } from 'typeorm'
import { PublicationEntity, PublicationType } from '@shared/entity/publication.entity'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { ApiProperty } from '@nestjs/swagger'
import { ReactionEntity } from '@services/reactions/entities/reaction.entity'
import { DialogEntity } from '@services/messenger/dialog/entities/dialog.entity'

@Entity({ name: 'messages', comment: 'Сообщения, которыми пользователи могут обмениваться в диалоге' })
export class MessageEntity extends PublicationEntity {
    @ApiProperty({ description: 'Сообщение, на которое отвечает данное сообщение', type: () => MessageEntity, nullable: true })
    @ManyToOne(() => MessageEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reply_to_id' })
    reply_to: MessageEntity | null

    @ApiProperty({ description: 'Массив всех сообщений, которые являются ответами на данное сообщение', type: () => [MessageEntity] })
    @OneToMany(() => MessageEntity, message => message.reply_to)
    replies: MessageEntity[]

    @ApiProperty({ description: 'Оригинальное сообщение, если данное сообщение является пересланным', type: () => MessageEntity, nullable: true })
    @ManyToOne(() => MessageEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'original_message_id' })
    original_message: MessageEntity | null

    @ApiProperty({ description: 'Массив всех пересылок данного сообщения', type: () => [MessageEntity] })
    @OneToMany(() => MessageEntity, message => message.original_message)
    forwards: MessageEntity[]

    @ApiProperty({ description: 'Является ли сообщение пересланным', type: Boolean })
    @Column({ type: 'boolean', default: false, comment: 'Является ли сообщение пересланным' })
    is_forwarded: boolean

    @ApiProperty({ description: 'Количество пересылок сообщения', type: Number })
    @Column({ type: 'int', default: 0, comment: 'Количество пересылок сообщения' })
    forward_count: number

    @ApiProperty({ description: 'Дата получения сообщения', type: Date, nullable: true })
    @Column({ nullable: true, type: 'timestamp', comment: 'Дата получения сообщения (обновляется когда сообщение дошло до пользователя)' })
    date_delivered: Date | null

    @ApiProperty({ description: 'Дата прочтения сообщения', type: Date, nullable: true })
    @Column({ nullable: true, type: 'timestamp', comment: 'Дата прочтения сообщения (обновляется когда сообщение было открыто пользователем)' })
    date_read: Date | null

    @ApiProperty({ description: 'Дата истечения срока действия сообщения', type: Date, nullable: true })
    @Column({ nullable: true, type: 'timestamp', comment: 'Дата, когда сообщение будет автоматически удалено' })
    expiration_date: Date | null

    @ApiProperty({ description: 'Было ли сообщение отредактировано', type: Boolean, default: false })
    @Column({ type: 'boolean', default: false, comment: 'Флаг, показывающий, было ли сообщение отредактировано' })
    is_edited: boolean

    @ApiProperty({ description: 'Голосовые сообщения', type: () => [MediaEntity] })
    @OneToMany(() => MediaEntity, publication => publication.voiceMessage)
    voices: MediaEntity[]

    @ApiProperty({ description: 'Видео сообщения', type: () => [MediaEntity] })
    @OneToMany(() => MediaEntity, publication => publication.videoMessage)
    videos: MediaEntity[]

    @ApiProperty({ description: 'Диалог которому принадлежит сообщение', type: () => DialogEntity })
    @ManyToOne(() => DialogEntity, dialog => dialog.messages, { onDelete: 'CASCADE' })
    dialog: DialogEntity

    @ApiProperty({ description: 'Диалог, в котором это сообщение является последним', type: () => DialogEntity, nullable: true })
    @OneToOne(() => DialogEntity, dialog => dialog.last_message, { lazy: true })
    last_message_in_dialog: Promise<DialogEntity | null>

    @ApiProperty({ description: 'Файлы, приложенные к сообщению', type: () => [MediaEntity] })
    @ManyToMany(() => MediaEntity, (media) => media.messagesRef, { onDelete: 'CASCADE' })
    @JoinTable({
        name: 'message_media',
        joinColumn: { name: 'message_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'media_id', referencedColumnName: 'id' },
    })
    media: MediaEntity[]

    @ApiProperty({ description: 'Реакции', type: () => [ReactionEntity] })
    @OneToMany(() => ReactionEntity, reaction => reaction.message, { cascade: true, onDelete: 'CASCADE', nullable: true, lazy: true })
    reactions: ReactionEntity[]

    constructor() {
        super()
        this.type = PublicationType.MESSAGE
    }
}

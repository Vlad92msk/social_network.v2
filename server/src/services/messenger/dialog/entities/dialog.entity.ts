import {
    Entity,
    Column,
    ManyToMany,
    OneToMany,
    JoinTable,
    PrimaryGeneratedColumn,
    OneToOne, JoinColumn,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { UserInfo } from '@services/users/user-info/entities'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { MessageEntity } from '@services/messenger/message/entity/message.entity'

@Entity({ name: 'dialogs', comment: 'Диалоги (чаты)' })
export class DialogEntity {
    @ApiProperty({ description: 'Уникальный идентификатор диалога' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Заголовок диалога' })
    @Column({ type: 'varchar', length: 100, nullable: true })
    title: string

    @ApiProperty({ description: 'Описание диалога' })
    @Column({ nullable: true, type: 'varchar', length: 400 })
    description: string

    @ApiProperty({ description: 'Фото диалога' })
    @Column({ nullable: true, type: 'varchar' })
    image: string

    @ApiProperty({ description: 'Тип диалога' })
    @Column({ type: 'enum', enum: ['private', 'public'], nullable: false, default: 'private' })
    type: 'private' | 'public'

    @ApiProperty({ description: 'Настройки диалога' })
    @Column('jsonb')
    options: {
        hide_me: boolean;
        notify: boolean;
    }

    @ApiProperty({ description: 'Ссылки в диалоге' })
    @Column('simple-array', { nullable: true, default: [] })
    links: string[]

    @ApiProperty({ description: 'Администраторы диалога', type: [UserInfo] })
    @ManyToMany(() => UserInfo)
    @JoinTable({
        name: 'dialog_admins',
        joinColumn: { name: 'dialog_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    })
    admins: UserInfo[]

    @ApiProperty({ description: 'Файлы, приложенные к диалогу' })
    @ManyToMany(() => MediaEntity)
    @JoinTable({
        name: 'dialog_media',
        joinColumn: { name: 'dialog_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'media_id', referencedColumnName: 'id' },
    })
    media: MediaEntity[]

    @ApiProperty({ description: 'Аудио файлы в диалоге' })
    @ManyToMany(() => MediaEntity)
    @JoinTable({
        name: 'dialog_audio',
        joinColumn: { name: 'dialog_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'audio_id', referencedColumnName: 'id' },
    })
    audio: MediaEntity[]

    @ApiProperty({ description: 'Видео файлы в диалоге' })
    @ManyToMany(() => MediaEntity)
    @JoinTable({
        name: 'dialog_videos',
        joinColumn: { name: 'dialog_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'video_id', referencedColumnName: 'id' },
    })
    videos: MediaEntity[]

    @ApiProperty({ description: 'Закрепленные сообщения', type: () => [MessageEntity] })
    @ManyToMany(() => MessageEntity, { onDelete: 'CASCADE', cascade: true })
    @JoinTable({
        name: 'dialog_fixed_messages',
        joinColumn: { name: 'dialog_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'message_id', referencedColumnName: 'id' },
    })
    fixed_messages: MessageEntity[]

    @ApiProperty({ description: 'Ссылка на видео-конференцию' })
    @Column({ nullable: true, type: 'varchar' })
    video_conference_link: string

    @ApiProperty({ description: 'Активна ли видео-конференция' })
    @Column({ default: false, type: 'boolean' })
    is_video_conference_active: boolean

    @ApiProperty({ description: 'Участники диалога', type: [UserInfo] })
    @ManyToMany(() => UserInfo)
    @JoinTable({
        name: 'dialog_participants',
        joinColumn: { name: 'dialog_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    })
    participants: UserInfo[]

    @ApiProperty({ description: 'ID непрочитанных сообщений' })
    @Column('simple-array', { nullable: true, default: [] })
    messages_not_read: string[]

    @ApiProperty({ description: 'Сообщения в диалоге', type: () => [MessageEntity] })
    @OneToMany(() => MessageEntity, message => message.dialog, { onDelete: 'CASCADE' })
    messages: MessageEntity[]

    @ApiProperty({ description: 'Последнее сообщение в диалоге', type: () => MessageEntity })
    @OneToOne(() => MessageEntity, message => message.last_message_in_dialog, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'last_message_id' })
    last_message: MessageEntity
}

import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn, OneToMany
} from 'typeorm'
import { UserInfo } from '@services/users/user-info/entities'
import { ApiProperty } from '@nestjs/swagger'

export enum PublicationType {
    POST='post',
    COMMENTARY='commentary',
    MESSAGE='message',
}

@Entity({ name: 'publication', comment: 'Общий тип. В буквальном смысле не используется нигде в самостоятельной форме. На основе "Публикации" будут построены такие интерфейсы как "Пост", "Сообщение", "Комментарий" и возможно что-то еще.' })
export abstract class PublicationEntity {
    @ApiProperty({ description: 'Уникальный идентификатор публикации' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Текст публикации' })
    @Column({ type: 'text', nullable: false, comment: 'Текст' })
    text: string

    @ApiProperty({
        description: 'Тип публикации',
        enum: PublicationType,
        enumName: 'PublicationType'
    })
    @Column({ type: 'enum', enum: PublicationType, comment: 'Тип публикации' })
    type: PublicationType

    @ApiProperty({ description: 'Дата создания публикации' })
    @CreateDateColumn({ comment: 'Дата создания' })
    date_created: Date

    @ApiProperty({ description: 'Дата последнего обновления публикации' })
    @UpdateDateColumn({ comment: 'Дата обновления' })
    date_updated: Date

    @ApiProperty({ description: 'Автор публикации', type: () => UserInfo })
    @ManyToOne(() => UserInfo)
    @JoinColumn({ name: 'author_id' })
    author: UserInfo
}

import { ApiProperty } from '@nestjs/swagger'
import { ReactionEntity } from '@services/reactions/entities/reaction.entity'
import { MediaEntity } from '@src/services/media/info/entities/media.entity'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { UserInfoType, UserStatus } from '../../_interfaces'
import { UserAbout } from './user-about.entity'

@Entity({ comment: 'Профиль пользователя' })
export class UserInfo implements UserInfoType {
    @ApiProperty({ description: 'ID пользователя' })
    @PrimaryGeneratedColumn()
    id: number

    @ApiProperty({ description: 'Публичный ID пользователя' })
    @Column({ nullable: false, type: 'varchar', length: 40, comment: 'Публичный ID', unique: true })
    public_id: string

    @ApiProperty({ description: 'Имя пользователя' })
    @Column({ nullable: false, type: 'varchar', length: 70, comment: 'Имя' })
    name: string

    @ApiProperty({ description: 'URL фото профиля', required: false })
    @Column({ nullable: true, type: 'varchar', length: 200, comment: 'Фото профиля' })
    profile_image: string

    //__________________
    // Связи

    @ApiProperty({ description: 'Общая информация о пользователе', type: () => UserAbout })
    @OneToOne(type => UserAbout, { cascade: true, onDelete: 'CASCADE', })
    @JoinColumn({ name: 'user_id' })
    about_info: UserAbout

    @ApiProperty({ description: 'Связанные медиа элементы', type: [MediaEntity] })
    @ManyToMany(() => MediaEntity, media => media.tagged_users)
    medias_check: MediaEntity[]

    @ApiProperty({ description: 'Реакции пользователя', type: [ReactionEntity] })
    @OneToMany(() => ReactionEntity, reaction => reaction.user)
    reactions: ReactionEntity[]

    //__________________
    // Автогенерация

    @BeforeInsert()
    generateName() {
        this.name = `Rename_user_${uuidv4()}`
    }

    @BeforeInsert()
    generatePublicId() {
        this.public_id = uuidv4()
    }
}

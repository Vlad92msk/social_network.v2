import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BeforeInsert,
    OneToOne,
    JoinColumn,
    ManyToMany,
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { UserAbout } from './user-about.entity'
import { UserAboutType, UserInfoType } from '../../_interfaces'
import { MediaEntity } from '@src/services/media/info/entities/media.entity'
import { MediaItem } from '@src/services/media/info/interfaces/media-item'
import { ApiProperty } from "@nestjs/swagger";

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
    @OneToOne(type => UserAbout, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    about_info: UserAboutType

    @ApiProperty({ description: 'Связанные медиа элементы', type: [MediaEntity] })
    @ManyToMany(() => MediaEntity, media => media.tagged_users)
    medias_check: MediaItem[]

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

import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm'
import { ProfileInfoType, ProfileType } from '../../_interfaces'
import { UserInfo } from '@services/users/user-info/entities/user.entity'
import { UserInfoType } from '@src/services/users/_interfaces'
import { Settings } from './settings.entity'
import { ProfileSettings } from '../../_interfaces/settings'
import { ApiProperty } from '@nestjs/swagger'

@Entity({ comment: 'Профиль пользователя' })
export class UserProfileInfo implements ProfileInfoType {
    @ApiProperty({ description: 'ID профиля' })
    @PrimaryGeneratedColumn()
    id: number

    @ApiProperty({ description: 'Email пользователя' })
    @Column({ type: 'varchar', length: 40, nullable: false, unique: true })
    email: string

    @ApiProperty({ description: 'Тип профиля', enum: ProfileType })
    @Column({ type: 'enum', nullable: false, enum: ProfileType, default: ProfileType.USER })
    type: ProfileType

    @ApiProperty({ description: 'Информация о пользователе', type: UserInfo })
    @OneToOne(type => UserInfo, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_info_id', referencedColumnName: 'id' })
    user_info: UserInfo

    @ApiProperty({ description: 'Настройки профиля', type: () => Settings })
    @OneToOne(type => Settings, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'settings_id', referencedColumnName: 'id' })
    settings: Settings
}

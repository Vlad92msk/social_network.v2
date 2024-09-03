import { Entity, PrimaryGeneratedColumn } from 'typeorm'
import { ProfileSettings } from '../../_interfaces/settings'
import { ApiProperty } from '@nestjs/swagger'

@Entity({ comment: 'Настройки профиля пользователя' })
export class Settings implements ProfileSettings {
    @ApiProperty({ description: 'ID настроек' })
    @PrimaryGeneratedColumn()
    id: number
}

import { Entity, PrimaryGeneratedColumn } from 'typeorm'
import { ProfileSettings } from '../../_interfaces/settings'

@Entity({ comment: 'Настройки профиля пользователя' })
export class Settings implements ProfileSettings {
    @PrimaryGeneratedColumn()
    id: number
}

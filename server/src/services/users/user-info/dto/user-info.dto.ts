import { ApiProperty } from '@nestjs/swagger'
import { UserAboutType } from '../../_interfaces'
import { UserAbout } from '@services/users/user-info/entities'

export class UserInfoDto {
    @ApiProperty({ description: 'ID пользователя' })
    id: number

    @ApiProperty({ description: 'Публичный ID пользователя' })
    public_id: string

    @ApiProperty({ description: 'Имя пользователя' })
    name: string

    @ApiProperty({ description: 'URL фото профиля', required: false })
    profile_image: string

    @ApiProperty({ description: 'Общая информация о пользователе', type: UserAbout })
    about_info: UserAboutType
}

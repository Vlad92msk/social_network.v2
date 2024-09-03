import { IsObject, IsOptional, IsString } from 'class-validator'
import { UserAboutType, UserInfoType } from '../../_interfaces'
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto implements Partial<UserInfoType> {
    @ApiProperty({
        description: 'Публичный ID пользователя',
        required: false,
        example: 'user-123'
    })
    @IsOptional()
    public_id: string

    @ApiProperty({
        description: 'Имя пользователя',
        required: false,
        example: 'Иван Иванов'
    })
    @IsString()
    @IsOptional()
    name: string

    @ApiProperty({
        description: 'URL фото профиля',
        required: false,
        example: 'https://example.com/profile.jpg'
    })
    @IsString()
    @IsOptional()
    profile_image: string

    @ApiProperty({
        description: 'Общая информация о пользователе',
        required: false,
        type: 'object',
        example: {
            study: 'Университет NAME',
            working: 'Компания ABC',
            position: 'Разработчик',
            description: 'Опытный разработчик с 5-летним стажем',
            banner_image: 'https://example.com/banner.jpg'
        }
    })
    @IsOptional()
    @IsObject()
    about_info: UserAboutType
}

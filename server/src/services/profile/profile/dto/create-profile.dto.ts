import { IsEmail } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateProfileDto {
    @ApiProperty({
        description: 'Email пользователя',
        example: 'user@example.com'
    })
    @IsEmail()
    email: string
}

import { IsEmail } from 'class-validator'

export class CreateProfileDto {
    @IsEmail()
    email: string
}

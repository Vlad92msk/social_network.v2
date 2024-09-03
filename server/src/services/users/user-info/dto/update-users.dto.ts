import { IsOptional, IsString, ValidateNested, } from 'class-validator'
import { Type } from 'class-transformer'
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { UserInfo } from '../entities'
import { UpdateUserAboutDto } from './update-user-about.dto'
import { TransformToObject } from '@shared/decorators'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateUserDto extends IntersectionType(
    PickType(PartialType(UserInfo, { skipNullProperties: true }), ['name', 'public_id']),
) {

    @ApiProperty({ description: 'Информация о пользователе', required: false, type: () => UpdateUserAboutDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateUserAboutDto)
    @TransformToObject()
    about_info?: UpdateUserAboutDto

    @ApiProperty({ description: 'ID фото профиля', required: false })
    @IsOptional()
    @IsString()
    profile_image_id: string

    @ApiProperty({ description: 'ID фото баннера', required: false })
    @IsOptional()
    @IsString()
    banner_image_id: string
}

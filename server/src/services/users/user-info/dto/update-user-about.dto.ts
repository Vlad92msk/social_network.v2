import { IntersectionType, OmitType, PartialType } from '@nestjs/mapped-types'
import { UserAbout } from '../entities'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'


export class UpdateUserAboutDto extends IntersectionType(
    OmitType(PartialType(UserAbout, { skipNullProperties: true }), ['id', 'banner_image']),
)  {
    @ApiProperty({ description: 'Место учебы', required: false })
    @IsOptional()
    @IsString()
    study: string

    @ApiProperty({ description: 'Место работы', required: false })
    @IsOptional()
    @IsString()
    working: string

    @ApiProperty({ description: 'Должность', required: false })
    @IsOptional()
    @IsString()
    position: string

    @ApiProperty({ description: 'Описание', required: false })
    @IsOptional()
    @IsString()
    description: string
}

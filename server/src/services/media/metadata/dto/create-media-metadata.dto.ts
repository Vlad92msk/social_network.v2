import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator'
import { MediaItemType } from '../interfaces/mediaItemType'
import { ApiProperty } from '@nestjs/swagger'

export class CreateMediaMetadataDto {
    @ApiProperty({ description: 'ID пользователя' })
    @IsString()
    user_id: number

    @ApiProperty({ description: 'Название файла' })
    @IsString()
    name: string

    @ApiProperty({ description: 'Путь к файлу' })
    @IsString()
    src: string

    @ApiProperty({ description: 'MIME-тип файла' })
    @IsString()
    mimeType: string

    @ApiProperty({ description: 'Размер файла в байтах' })
    @IsNumber()
    size: number

    @ApiProperty({ description: 'Дата последнего изменения файла' })
    @IsDate()
    lastModified: Date

    @ApiProperty({ description: 'Тип медиа-файла', enum: MediaItemType })
    @IsEnum(MediaItemType)
    type: MediaItemType
}

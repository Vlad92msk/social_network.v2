import { MediaItemType } from '@services/media/metadata/interfaces/mediaItemType'
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { PaginationAndSortingDto } from 'src/shared/dto'
import { IntersectionType, } from '@nestjs/mapped-types'
import { TransformToArray, TransformToEnum } from '@shared/decorators'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class GetMediaDto extends IntersectionType(
    PaginationAndSortingDto
) {
    @ApiPropertyOptional({ description: 'Массив ID файлов', type: [String] })
    @IsArray()
    @TransformToArray()
    @IsOptional()
    file_ids?: string[]

    @ApiProperty({ description: 'Название альбома', required: false })
    @IsString()
    @IsOptional()
    album_name?: string

    @ApiProperty({ description: 'Дата создания записи (с какой искать)', required: false })
    @IsDate()
    @IsOptional()
    created_at_from?: Date

    @ApiProperty({ description: 'Дата создания записи (по какую искать)', required: false })
    @IsDate()
    @IsOptional()
    created_at_to?: Date

    @ApiProperty({ description: 'Дата последнего обновления записи (с какой искать)', required: false })
    @IsDate()
    @IsOptional()
    updated_at_from?: Date

    @ApiProperty({ description: 'Дата последнего обновления записи (по какую искать)', required: false })
    @IsDate()
    @IsOptional()
    updated_at_to?: Date

    @ApiProperty({ description: 'Количество просмотров (от скольки)', required: false })
    @IsNumber()
    @IsOptional()
    views_count_from?: number

    @ApiProperty({ description: 'Количество просмотров (до скольки)', required: false })
    @IsNumber()
    @IsOptional()
    views_count_to?: number

    @ApiProperty({ description: 'Количество комментариев', required: false })
    @IsNumber()
    @IsOptional()
    comments_count_from?: number

    @ApiProperty({ description: 'Количество комментариев (до скольки)', required: false })
    @IsNumber()
    @IsOptional()
    comments_count_to?: number

    @ApiProperty({ description: 'ID автора/владельца', required: false })
    @IsNumber()
    @IsOptional()
    owner_id?: number

    @ApiProperty({ description: 'ID отмеченных пользователей', type: [Number], required: false })
    @IsArray()
    @IsOptional()
    tagged_users_ids?: number[]

    @ApiProperty({ description: 'ID тегов', required: false })
    @IsArray()
    @IsOptional()
    tags_ids?: number[]

    @ApiProperty({ description: 'Тип медиа-файла', enum: MediaItemType, required: false })
    @TransformToEnum(MediaItemType)
    @IsEnum(MediaItemType, {message: 'Значение должно быть enum'})
    @IsOptional()
    type?: MediaItemType
}

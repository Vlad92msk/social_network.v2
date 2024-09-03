import { IsIn, IsOptional, IsString } from 'class-validator'
import { IntersectionType, PartialType } from '@nestjs/mapped-types'
import { CreateMediaMetadataDto } from './create-media-metadata.dto'
import { PaginationAndSortingDto } from 'src/shared/dto'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class GetMediaMetadataDto extends IntersectionType(
    PartialType(CreateMediaMetadataDto),
    PaginationAndSortingDto<CreateMediaMetadataDto>
) {
    @ApiPropertyOptional({ description: 'Поле для сортировки', enum: ['name', 'type', 'lastModified', 'size'] })
    @IsOptional()
    @IsString()
    @IsIn(['name', 'type', 'lastModified', 'size'])
    sort_by?: 'name' | 'type' | 'lastModified' | 'size'

    @ApiPropertyOptional({ description: 'Массив ID файлов', type: [String] })
    @IsOptional()
    @IsString({ each: true })
    file_ids?: string[]
}

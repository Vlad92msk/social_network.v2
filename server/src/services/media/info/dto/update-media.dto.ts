import { IntersectionType, } from '@nestjs/mapped-types'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TransformToArray } from '@shared/decorators'
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { PaginationAndSortingDto } from 'src/shared/dto'

export class UpdateMediaDto extends IntersectionType(
    PaginationAndSortingDto
) {
    @ApiPropertyOptional({ description: 'Массив ID файлов которые будут изменены', type: [String] })
    @IsArray()
    @TransformToArray()
    @IsNotEmpty()
    target_ids?: string[]

    @ApiProperty({ description: 'Название альбома', required: false, nullable: true, type: String })
    @IsString()
    @IsOptional()
    album_name?: string
}

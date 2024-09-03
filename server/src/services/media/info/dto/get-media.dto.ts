import { IsArray, IsOptional } from 'class-validator'
import { PaginationAndSortingDto } from 'src/shared/dto'
import { IntersectionType, } from '@nestjs/mapped-types'
import { TransformToArray } from '@shared/decorators'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class GetMediaDto extends IntersectionType(
    PaginationAndSortingDto
) {
    @ApiPropertyOptional({ description: 'Массив ID файлов', type: [String] })
    @IsOptional()
    @IsArray()
    @TransformToArray()
    file_ids: string[]
}

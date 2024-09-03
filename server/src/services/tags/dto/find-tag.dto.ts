import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { Tag } from '../entity'
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { EntityType } from '@shared/types'
import { PaginationAndSortingDto } from '@shared/dto'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class FindTagDto extends IntersectionType(
    PartialType(PickType(Tag, ['value', 'name', 'entity_type'])),
    PaginationAndSortingDto<Tag>
) {
    @ApiPropertyOptional({ description: 'Тип сущности', enum: EntityType })
    @IsOptional()
    @IsEnum(EntityType)
    entity_type?: EntityType

    @ApiPropertyOptional({ description: 'Значение тега' })
    @IsOptional()
    @IsString()
    value?: string

    @ApiPropertyOptional({ description: 'Название тега' })
    @IsOptional()
    @IsString()
    name?: string

    @ApiPropertyOptional({ description: 'Поисковый запрос' })
    @IsOptional()
    @IsString()
    search?: string

    @ApiPropertyOptional({ description: 'Поле для сортировки', enum: ['value', 'name', 'entity_type'] })
    @IsString()
    @IsOptional()
    @IsIn(['value', 'name', 'entity_type'])
    sort_by?: 'value' | 'name' | 'entity_type'
}

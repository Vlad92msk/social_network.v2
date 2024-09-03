import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { Tag } from '../entity'
import { IsEnum, IsOptional } from 'class-validator'
import { EntityType } from '@shared/types'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateTagDto extends IntersectionType(
    PartialType(PickType(Tag, ['entity_type', 'name', 'value'])),
) {
    @ApiPropertyOptional({ description: 'Тип сущности', enum: EntityType })
    @IsOptional()
    @IsEnum(EntityType)
    entity_type?: EntityType

    @ApiPropertyOptional({ description: 'Название тега' })
    name?: string

    @ApiPropertyOptional({ description: 'Значение тега' })
    value?: string
}

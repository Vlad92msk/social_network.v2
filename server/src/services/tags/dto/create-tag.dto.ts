import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { Tag } from '../entity'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { EntityType } from '@shared/types'
import { ApiProperty } from '@nestjs/swagger'

export class CreateTagDto extends IntersectionType(
    PartialType(PickType(Tag, ['value', 'name', 'entity_type'])),
) {
    @ApiProperty({ description: 'Тип сущности', enum: EntityType })
    @IsNotEmpty()
    @IsEnum(EntityType)
    entity_type: EntityType

    @ApiProperty({ description: 'Значение тега' })
    @IsNotEmpty()
    @IsString()
    value: string

    @ApiProperty({ description: 'Название тега' })
    @IsNotEmpty()
    @IsString()
    name: string
}

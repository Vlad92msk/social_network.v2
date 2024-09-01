import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { Tag } from '../entity'
import { IsEnum, IsOptional } from 'class-validator'
import { EntityType } from '@shared/types'

export class UpdateTagDto extends IntersectionType(
    PartialType(PickType(Tag, ['entity_type', 'name', 'value'])),
) {
    @IsOptional()
    @IsEnum(EntityType)
    entity_type: EntityType
}

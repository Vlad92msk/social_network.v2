import { IntersectionType, PartialType, PickType } from "@nestjs/mapped-types";
import { Tag } from "../entity";
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EntityType } from "@shared/types";
import { PaginationAndSortingDto } from "@shared/dto";

export class FindTagDto extends IntersectionType(
    PartialType(PickType(Tag, ['value', 'name', 'entity_type'])),
    PaginationAndSortingDto<Tag>
) {
    @IsOptional()
    @IsEnum(EntityType)
    entity_type: EntityType

    @IsOptional()
    @IsString()
    value: string

    @IsOptional()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    search: string

    @IsString()
    @IsOptional()
    @IsIn(['value', 'name', 'entity_type'])
    sort_by: 'value' | 'name' | 'entity_type'
}

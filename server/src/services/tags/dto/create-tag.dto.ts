import { IntersectionType, PartialType, PickType } from "@nestjs/mapped-types";
import { Tag } from "../entity";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { EntityType } from "@shared/types";

export class CreateTagDto extends IntersectionType(
    PartialType(PickType(Tag, ['value', 'name', 'entity_type'])),
) {
    @IsNotEmpty()
    @IsEnum(EntityType)
    entity_type: EntityType

    @IsNotEmpty()
    @IsString()
    value: string

    @IsNotEmpty()
    @IsString()
    name: string
}

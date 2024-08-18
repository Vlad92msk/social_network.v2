import { IsOptional, IsString, ValidateNested, } from 'class-validator';
import { Type } from "class-transformer";
import { IntersectionType, PartialType, PickType } from "@nestjs/mapped-types";
import { UserInfo } from "../entities";
import { UpdateUserAboutDto } from "./update-user-about.dto";
import { TransformToObject } from "@shared/decorators";

export class UpdateUserDto extends IntersectionType(
    PickType(PartialType(UserInfo, { skipNullProperties: true }), ['name', 'public_id']),
) {

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateUserAboutDto)
    @TransformToObject()
    about_info?: UpdateUserAboutDto

    @IsOptional()
    @IsString()
    profile_image_id: string

    @IsOptional()
    @IsString()
    banner_image_id: string
}

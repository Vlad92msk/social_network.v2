import { IsNotEmpty, IsOptional, ValidateNested, } from 'class-validator';
import { Type } from "class-transformer";
import { IntersectionType, PartialType, PickType } from "@nestjs/mapped-types";
import { UserInfo } from "../entities";
import { UpdateUserAboutDto } from "./update-user-about.dto";

export class UpdateUserDto extends IntersectionType(
    PickType(PartialType(UserInfo, { skipNullProperties: true }), ['name', 'public_id']),
) {
    // @IsNotEmpty()
    // public_id: string

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateUserAboutDto)
    about_info?: UpdateUserAboutDto;
}

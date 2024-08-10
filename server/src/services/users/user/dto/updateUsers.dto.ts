import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { UserAboutType, UserInfoType } from "../../_interfaces";
import { PaginationDto } from "@src/dto";

export class UpdateUserDto extends PaginationDto implements Partial<UserInfoType> {
    @IsNotEmpty()
    public_id: string

    @IsString()
    @IsOptional()
    name: string

    @IsString()
    @IsOptional()
    profile_image: string

    @IsOptional()
    @IsObject()
    about_info: UserAboutType
}

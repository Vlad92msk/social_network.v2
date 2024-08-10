import { IsObject, IsOptional, IsString } from 'class-validator';
import { UserAboutType, UserInfoType } from "../../_interfaces";

export class CreateUserDto implements Partial<UserInfoType> {
    @IsOptional()
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

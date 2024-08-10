import { IsString, IsOptional, IsEnum, IsIn } from 'class-validator';
import { SortBy, SortDirection } from "src/types";
import { UserInfoType } from "../../_interfaces";
import { PaginationDto } from "@src/dto";

export class GetUsersDto extends PaginationDto implements Partial<UserInfoType>, SortBy<UserInfoType> {
    @IsString()
    @IsOptional()
    name: string

    @IsString()
    @IsOptional()
    public_id: string

    @IsString()
    @IsOptional()
    @IsIn(['name'])
    sort_by: 'name'

    @IsString()
    @IsOptional()
    @IsEnum(SortDirection)
    sort_direction: SortDirection
}

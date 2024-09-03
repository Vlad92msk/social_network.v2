import { IsIn, IsOptional, IsString } from 'class-validator'
import { PaginationAndSortingDto } from 'src/shared/dto'
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { UserInfo } from '../entities'
import { ApiProperty } from "@nestjs/swagger";

export class GetUsersDto extends IntersectionType(
    PickType(PartialType(UserInfo, { skipNullProperties: true }), ['name', 'public_id', 'id']),
    PaginationAndSortingDto<UserInfo>
) {
    @ApiProperty({ description: 'Поле для сортировки', enum: ['name'], required: false })
    @IsString()
    @IsOptional()
    @IsIn(['name'])
    sort_by: 'name'
}

import { IsIn, IsOptional, IsString } from 'class-validator'
import { PaginationAndSortingDto } from 'src/shared/dto'
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { UserInfo } from '../entities'

export class GetUsersDto extends IntersectionType(
    PickType(PartialType(UserInfo, { skipNullProperties: true }), ['name', 'public_id', 'id']),
    PaginationAndSortingDto<UserInfo>
) {
    @IsString()
    @IsOptional()
    @IsIn(['name'])
    sort_by: 'name'
}

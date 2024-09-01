import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { SortDirection } from 'src/shared/types'
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from 'src/shared/utils'

export class PaginationAndSortingDto<T extends object = any> {
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    page?: number = DEFAULT_PAGE

    @IsOptional()
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    per_page?: number = DEFAULT_PER_PAGE

    @IsOptional()
    @IsString()
    sort_by?: keyof T

    @IsOptional()
    @IsEnum(SortDirection)
    sort_direction?: SortDirection = SortDirection.ASC
}

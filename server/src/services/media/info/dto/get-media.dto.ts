import { IsArray, IsOptional } from 'class-validator'
import { PaginationAndSortingDto } from 'src/shared/dto'
import { IntersectionType, } from '@nestjs/mapped-types'
import { TransformToArray } from '@shared/decorators'


export class GetMediaDto extends IntersectionType(
    PaginationAndSortingDto
) {
    // @IsOptional()
    // @IsString()
    // @IsIn(['name', 'type', 'user_id', 'lastModified', 'size'])
    // sort_by?: 'name' | 'type' | 'user_id' | 'lastModified' | 'size';

    @IsOptional()
    @IsArray()
    @TransformToArray()
    file_ids: string[]
}

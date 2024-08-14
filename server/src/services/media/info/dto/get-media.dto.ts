import { IsArray } from 'class-validator';
import { PaginationAndSortingDto } from "@src/dto";
import { IntersectionType } from "@nestjs/mapped-types";


export class GetMediaDto extends IntersectionType(
    PaginationAndSortingDto
) {
    // @IsOptional()
    // @IsString()
    // @IsIn(['name', 'type', 'user_id', 'lastModified', 'size'])
    // sort_by?: 'name' | 'type' | 'user_id' | 'lastModified' | 'size';

    @IsArray()
    file_ids: string[];
}

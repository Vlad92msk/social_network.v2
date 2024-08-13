import { IsArray } from 'class-validator';
import { PaginationDto } from "@src/dto";

export class GetMediaDto extends PaginationDto {
    @IsArray()
    file_ids: string[];
}

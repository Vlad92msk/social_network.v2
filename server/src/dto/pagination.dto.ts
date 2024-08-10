import { Pagination } from "@src/types";
import { IsNumber, IsOptional } from 'class-validator';

export class PaginationDto implements Pagination {
    @IsNumber()
    @IsOptional()
    per_page: number

    @IsNumber()
    @IsOptional()
    page: number
}

import { IsIn, IsOptional, IsString } from 'class-validator';
import { IntersectionType, PartialType } from "@nestjs/mapped-types";
import { CreateMediaMetadataDto } from "./create-media-metadata.dto";
import { PaginationAndSortingDto } from "src/shared/dto";


export class GetMediaMetadataDto extends IntersectionType(
    PartialType(CreateMediaMetadataDto),
    PaginationAndSortingDto<CreateMediaMetadataDto>
) {
    @IsOptional()
    @IsString()
    @IsIn(['name', 'type', 'user_id', 'lastModified', 'size'])
    sort_by?: 'name' | 'type' | 'user_id' | 'lastModified' | 'size';

    @IsOptional()
    @IsString({ each: true })
    file_ids?: string[];
}

import { IsArray, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PartialType, IntersectionType } from "@nestjs/mapped-types";
import { CreateMediaMetadataDto } from "./create-media-metadata.dto";
import { PaginationDto } from "@src/dto";
import { SortBy, SortDirection } from "@src/types";

class GetMediaMetadataBaseDto extends PartialType(CreateMediaMetadataDto) {
    @IsOptional()
    @IsString({ each: true })
    file_ids?: string[];
}

export class GetMediaMetadataDto extends IntersectionType(
    GetMediaMetadataBaseDto,
    PaginationDto
) implements SortBy<CreateMediaMetadataDto> {
    @IsString()
    @IsOptional()
    @IsIn(['name', 'type', 'user_id', 'lastModified', 'size'])
    sort_by?: 'name'

    @IsString()
    @IsOptional()
    @IsEnum(SortDirection)
    sort_direction?: SortDirection
}

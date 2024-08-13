import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { MediaItemType } from "../interfaces/mediaItemType";

export class CreateMediaMetadataDto {
    @IsString()
    name: string;

    @IsString()
    src: string;

    @IsString()
    mimeType: string;

    @IsNumber()
    size: number;

    @IsDate()
    lastModified: Date;

    @IsEnum(MediaItemType)
    type: MediaItemType;

    @IsString()
    user_id: string;

    // @IsDate()
    // date_upload: Date;
}

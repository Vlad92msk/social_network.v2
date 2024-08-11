import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaMetadata } from "./entities/media-metadata.entity";
import { MetadataService } from "./mediaMetadata.service";

@Module({
    imports: [TypeOrmModule.forFeature([MediaMetadata])],
    providers: [MetadataService],
    exports: [MetadataService],
})
export class MediaMetadataModule {}
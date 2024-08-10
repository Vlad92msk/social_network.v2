import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaMetadataService } from './mediaMetadata.service';
import { MediaMetadataController } from './mediaMetadata.controller';

@Module({
    imports: [TypeOrmModule.forFeature([])],
    providers: [MediaMetadataService],
    controllers: [MediaMetadataController],
})
export class MediaMetadataModule {}

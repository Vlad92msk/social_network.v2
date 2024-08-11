import { Module } from '@nestjs/common';
import { MediaInfoService } from './mediaInfo.service';
import { MediaInfoController } from './mediaInfo.controller';
import { MediaStorageModule } from "../storage/mediaStorage.module";
import { MediaMetadataModule } from "../metadata/mediaMetadata.module";

@Module({
    imports: [MediaMetadataModule, MediaStorageModule],
    providers: [MediaInfoService],
    controllers: [MediaInfoController],
})
export class MediaInfoModule {}

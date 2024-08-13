import { Module } from '@nestjs/common';
import { MediaInfoService } from './media-info.service';
import { MediaInfoController } from './media-info.controller';
import { MediaStorageModule } from "../storage/media-storage.module";
import { MediaMetadataModule } from "../metadata/media-metadata.module";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage()
        }),
        MediaStorageModule,
        MediaMetadataModule
    ],
    providers: [MediaInfoService],
    controllers: [MediaInfoController],
    // exports: [MediaInfoService],
})
export class MediaInfoModule {}

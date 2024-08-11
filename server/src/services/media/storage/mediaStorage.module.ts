import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaStorageService } from "./mediaStorage.service";
import { MediaMetadataModule } from "../metadata/mediaMetadata.module";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage()
        }),
        MediaMetadataModule,
        ConfigModule,
    ],
    providers: [MediaStorageService],
    exports: [MediaStorageService, MulterModule],
})
export class MediaStorageModule {}

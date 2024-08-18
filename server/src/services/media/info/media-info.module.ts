import { forwardRef, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaStorageModule } from '../storage/media-storage.module';
import { MediaMetadataModule } from '../metadata/media-metadata.module';
import { MediaInfoService } from './media-info.service';
import { MediaInfoController } from './media-info.controller';
import { memoryStorage } from "multer";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserInfoModule } from "@services/users/user-info/user-info.module";
import { MediaEntity } from "./entities/media.entity";
import { TagModule } from "@services/tags/tags.module";
import { MediaTagsController } from "./media-tags.controller";
import { MediaTagService } from "./media-tag.service"; // Import the UserInfoModule

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage()
        }),
        MediaStorageModule,
        MediaMetadataModule,
        TypeOrmModule.forFeature([MediaEntity]),
        forwardRef(() => UserInfoModule),
        forwardRef(() => TagModule),
    ],
    providers: [MediaInfoService, MediaTagService],
    controllers: [MediaInfoController, MediaTagsController],
    exports: [MediaInfoService, TypeOrmModule],
})
export class MediaInfoModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInfoService } from './user-info.service';
import * as databases from './entities'
import { UserInfoController } from './user-info.controller';
import { loadEntities } from "src/shared/utils";
import { MediaEntity } from "@services/media/info/entities/media.entity";
import { MediaInfoModule } from "@services/media/info/media-info.module";
import { MediaInfoService } from "@services/media/info/media-info.service";
import { UserAbout, UserInfo } from "./entities";

@Module({
    imports: [
        TypeOrmModule.forFeature([UserInfo, UserAbout]),
        forwardRef(() => MediaInfoModule)
    ],
    providers: [UserInfoService],
    controllers: [UserInfoController],
    exports: [UserInfoService, TypeOrmModule],
})
export class UserInfoModule {}

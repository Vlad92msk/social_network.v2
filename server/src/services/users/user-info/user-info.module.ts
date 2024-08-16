import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInfoService } from './user-info.service';
import * as databases from './entities'
import { UserInfoController } from './user-info.controller';
import { loadEntities } from "src/shared/utils";
import { MediaEntity } from "@services/media/info/entities/media.entity";
import { MediaInfoModule } from "@services/media/info/media-info.module";

@Module({
    imports: [TypeOrmModule.forFeature([...loadEntities(databases), MediaEntity]), MediaInfoModule],
    providers: [UserInfoService],
    controllers: [UserInfoController],
    exports: [UserInfoService],
})
export class UserInfoModule {}

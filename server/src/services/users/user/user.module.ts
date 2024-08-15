import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import * as databases from './entities'
import { UserController } from './user.controller';
import { loadEntities } from "src/shared/utils";
import { MediaEntity } from "@services/media/info/entities/media.entity";

@Module({
    imports: [TypeOrmModule.forFeature([...loadEntities(databases), MediaEntity])],
    providers: [UserService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}

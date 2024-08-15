import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import * as databases from './entities'
import { loadEntities } from "src/shared/utils";
import { UserModule } from "@src/services/users/user/user.module";

@Module({
    imports: [TypeOrmModule.forFeature([...loadEntities(databases)]), UserModule],
    providers: [ProfileService],
    controllers: [ProfileController],
})
export class ProfileModule {}

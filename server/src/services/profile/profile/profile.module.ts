import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProfileService } from './profile.service'
import { ProfileController } from './profile.controller'
import * as databases from './entities'
import { loadEntities } from 'src/shared/utils'
import { UserInfoModule } from '@services/users/user-info/user-info.module'

@Module({
    imports: [TypeOrmModule.forFeature([...loadEntities(databases)]), UserInfoModule],
    providers: [ProfileService],
    controllers: [ProfileController],
})
export class ProfileModule {}

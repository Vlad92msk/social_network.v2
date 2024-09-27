import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaInfoModule } from '@services/media/info/media-info.module'
import { UserAbout, UserInfo } from './entities'
import { UserInfoController } from './user-info.controller'
import { UserInfoService } from './user-info.service'

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

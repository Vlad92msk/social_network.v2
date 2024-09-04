import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DialogService } from './dialog.service'
import { DialogController } from './dialog.controller'
import { DialogEntity } from './entities/dialog.entity'
import { MessageModule } from '../message/message.module'
import { ConfigModule } from '@nestjs/config'
import { UserInfoModule } from '@services/users/user-info/user-info.module'
import { MediaInfoModule } from '@services/media/info/media-info.module'
import { DialogShortController } from "@services/messages/dialog/dialog-short.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([DialogEntity]),
        forwardRef(() => UserInfoModule),
        forwardRef(() => MessageModule),
        forwardRef(() => MediaInfoModule),
        ConfigModule,
    ],
    providers: [DialogService],
    controllers: [DialogController, DialogShortController],
    exports: [DialogService],
})
export class DialogModule {}

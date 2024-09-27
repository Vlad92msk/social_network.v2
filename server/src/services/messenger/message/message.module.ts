import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaInfoModule } from '@services/media/info/media-info.module'
import { UserInfoModule } from '@services/users/user-info/user-info.module'
import { PublicationEntity } from '@shared/entity/publication.entity'
import { MessageEntity } from './entity/message.entity'
import { MessageController } from './message.controller'
import { MessageService } from './message.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([PublicationEntity, MessageEntity]),
        forwardRef(() => MediaInfoModule),
        forwardRef(() => UserInfoModule),
        ConfigModule
    ],
    providers: [MessageService],
    controllers: [MessageController],
    exports: [MessageService],
})
export class MessageModule {}

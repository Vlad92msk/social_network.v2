import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessageEntity } from './entity/message.entity'
import { ReactionEntity } from '@shared/entity/reaction.entity'
import { MediaInfoModule } from '@services/media/info/media-info.module'
import { UserInfoModule } from '@services/users/user-info/user-info.module'
import { MessageService } from './message.service'
import { MessageController } from './message.controller'
import { PublicationEntity } from '@shared/entity/publication.entity'
import { ConfigModule } from '@nestjs/config'

@Module({
    imports: [
        TypeOrmModule.forFeature([PublicationEntity, MessageEntity, ReactionEntity]),
        forwardRef(() => MediaInfoModule),
        forwardRef(() => UserInfoModule),
        ConfigModule
    ],
    providers: [MessageService],
    controllers: [MessageController],
    exports: [MessageService],
})
export class MessageModule {}

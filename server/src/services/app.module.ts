import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import mainConfig from '@config/main.config'
import baseOrmConfig from '@config/orm.config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReactionsModule } from '@services/reactions/reactions.module'
import { ProfileModule } from '@src/services/profile/profile/profile.module'
import { UserInfoModule } from '@services/users/user-info/user-info.module'
import { MediaInfoModule } from '@src/services/media/info/media-info.module'
import { TagModule } from '@services/tags/tags.module'
import { MessageModule } from '@services/messenger/message/message.module'
import { CommentModule } from '@services/comments/comment/comment.module'
import { PostModule } from '@services/posts/post/post.module'
import { ScheduleModule } from '@nestjs/schedule'
import { DialogModule } from '@services/messenger/dialog/dialog.module'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { VideoConferenceModule } from '@services/messenger/video-conference/video-conference.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [mainConfig, baseOrmConfig],
      isGlobal: true,
      envFilePath: '../.env',
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: baseOrmConfig,
    }),
    ProfileModule,
    UserInfoModule,
    MediaInfoModule,
    TagModule,
    MessageModule,
    CommentModule,
    PostModule,
    DialogModule,
    VideoConferenceModule,
    ReactionsModule,
  ],
})
export class AppModule {
}



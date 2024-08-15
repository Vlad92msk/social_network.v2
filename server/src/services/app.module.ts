import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import mainConfig from '@config/main.config'
import baseOrmConfig from '@config/orm.config'
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileModule } from "@src/services/profile/profile/profile.module";
import { UserModule } from "@src/services/users/user/user.module";
import { MediaInfoModule } from "@src/services/media/info/media-info.module";
import { TagModule } from "@services/tags/tags.module";
import { MessageModule } from "@services/messages/message/message.module";
import { CommentModule } from "@services/comments/comment/comment.module";
import { PostModule } from "@services/posts/post/post.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [mainConfig, baseOrmConfig],
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: baseOrmConfig,
    }),
    ProfileModule,
    UserModule,
    MediaInfoModule,
    TagModule,
    MessageModule,
    CommentModule,
    PostModule,
  ],
})
export class AppModule {
}



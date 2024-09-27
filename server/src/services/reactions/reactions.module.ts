import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommentModule } from '@services/comments/comment/comment.module'
import { MediaInfoModule } from '@services/media/info/media-info.module'
import { MessageModule } from '@services/messenger/message/message.module'
import { PostModule } from '@services/posts/post/post.module'
import { ReactionController } from './reactions.controller'
import { ReactionsService } from './reactions.service'
import { ReactionEntity } from './entities/reaction.entity'
import { ReactionBaseEntity } from './entities/reaction-base.entity'
import { UserInfoModule } from '@services/users/user-info/user-info.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ReactionEntity, ReactionBaseEntity]),
    forwardRef(() => PostModule),
    forwardRef(() => UserInfoModule),
    forwardRef(() => MediaInfoModule),
    forwardRef(() => CommentModule),
    forwardRef(() => MessageModule),
  ],
  providers: [ReactionsService],
  controllers: [ReactionController],
  exports: [ReactionsService],
})
export class ReactionsModule {}

import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaInfoModule } from '@services/media/info/media-info.module'
import { PostModule } from '@services/posts/post/post.module'
import { UserInfoModule } from '@services/users/user-info/user-info.module'
import { CommentController } from './comment.controller'
import { CommentService } from './comment.service'
import { CommentEntity } from './entities/comment.entity'

@Module({
    imports: [
      TypeOrmModule.forFeature([CommentEntity]),
      forwardRef(() => PostModule),
      forwardRef(() => UserInfoModule),
      forwardRef(() => MediaInfoModule),
    ],
    providers: [CommentService],
    controllers: [CommentController],
    exports: [CommentService],
})
export class CommentModule {}

import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PostEntity } from './entities/post.entity'
import { MediaInfoModule } from '@services/media/info/media-info.module'
import { UserInfoModule } from '@services/users/user-info/user-info.module'
import { ConfigModule } from '@nestjs/config'
import { TagModule } from '@services/tags/tags.module'
import { PostsService } from '@services/posts/post/post.service'
import { PostsController } from '@services/posts/post/post.controller'
import { PublicationEntity } from '@shared/entity/publication.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity, PublicationEntity]),
        forwardRef(() => MediaInfoModule),
        forwardRef(() => UserInfoModule),
        forwardRef(() => TagModule),
        ConfigModule,
    ],
    providers: [PostsService],
    controllers: [PostsController],
    // Экспортируем PostService для использования в других модулях
    exports: [PostsService]
})
export class PostModule {}

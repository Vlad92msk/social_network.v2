import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostService } from './post.service';
import { PostController } from './post.controller';

@Module({
    imports: [TypeOrmModule.forFeature()],
    providers: [PostService],
    controllers: [PostController],
})
export class PostModule {}

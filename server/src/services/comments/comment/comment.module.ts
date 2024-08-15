import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { CommentEntity } from "./entities/comment.entity";

@Module({
    imports: [TypeOrmModule.forFeature([CommentEntity])],
    providers: [CommentService],
    controllers: [CommentController],
})
export class CommentModule {}

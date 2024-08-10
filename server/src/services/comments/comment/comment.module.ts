import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

@Module({
    imports: [TypeOrmModule.forFeature([])],
    providers: [CommentService],
    controllers: [CommentController],
})
export class CommentModule {}

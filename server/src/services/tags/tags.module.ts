import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from "./entity";
import { TagsService } from "./tags.service";
import { TagsController } from "./tag.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Tag])],
    providers: [TagsService],
    controllers: [TagsController],
    exports: [TagsService],
})
export class TagModule {}

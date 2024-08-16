import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from "@services/tags/entity";

@Module({
    imports: [TypeOrmModule.forFeature([Tag])],
})
export class TagModule {}

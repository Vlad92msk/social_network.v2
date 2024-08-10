import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaInfoService } from './mediaInfo.service';
import { MediaInfoController } from './mediaInfo.controller';

@Module({
    imports: [TypeOrmModule.forFeature([])],
    providers: [MediaInfoService],
    controllers: [MediaInfoController],
})
export class MediaInfoModule {}

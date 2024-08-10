import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaStorageService } from './mediaStorage.service';
import { MediaStorageController } from './mediaStorage.controller';

@Module({
    imports: [TypeOrmModule.forFeature([])],
    providers: [MediaStorageService],
    controllers: [MediaStorageController],
})
export class UserProfileModule {}

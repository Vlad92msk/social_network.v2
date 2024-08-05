import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserProfile } from './entities/userProfile.entity';
import { UserController } from './user.controller';

@Module({
    imports: [TypeOrmModule.forFeature([UserProfile])],
    providers: [UserService],
    controllers: [UserController],
})
export class UserProfileModule {}

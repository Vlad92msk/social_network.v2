import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfile } from './entities/userProfile.entity';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(':email')
    async getUserByEmail(@Param('email') email: string): Promise<UserProfile> {
        return this.userService.getUserByEmail(email);
    }
}

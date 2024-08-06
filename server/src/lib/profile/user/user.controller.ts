import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfile } from './entities/userProfile.entity';

@Controller('profile/user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(':email')
    async getUserByEmail(@Param('email') email: string): Promise<UserProfile> {
        const user = await this.userService.getUserByEmail(email);
        return ({
            email: user.email,
            dialogsIds: ['1', '2', '3'],
            uuid: user.uuid,
            id: user.id,
            // @ts-ignore
            userInfo: user
        });
    }
}

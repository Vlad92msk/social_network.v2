import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/userProfile.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserProfile)
        private userProfileRepository: Repository<UserProfile>,
    ) {}

    async getUserByEmail(email: string): Promise<UserProfile> {
        let user = await this.userProfileRepository.findOne({ where: { email } });

        if (!user) {
            user = this.userProfileRepository.create({ email });
            await this.userProfileRepository.save(user);
        }

        return user;
    }
}

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserProfileInfo } from './entities/profileInfo.entity'
import { Settings } from '@src/services/profile/profile/entities'
import { UserInfoService } from '@services/users/user-info/user-info.service'

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(UserProfileInfo)
        private userProfileRepository: Repository<UserProfileInfo>,

        @InjectRepository(Settings)
        private userSettingsRepository: Repository<Settings>,

        private userService: UserInfoService
    ) {}

    async getProfiles(): Promise<UserProfileInfo[]> {
        return await this.userProfileRepository.find({
            relations: [
                'user_info',
                'settings',
                'user_info.about_info',
            ]
        })
    }


    async getProfileInfo(email: string): Promise<UserProfileInfo> {
        let profile = await this.userProfileRepository.findOne({
            where: { email },
            relations: ['user_info', 'settings', 'user_info.about_info',]
        })

        if (!profile) {

            const settings = await this.userSettingsRepository.create()
            await this.userSettingsRepository.save(settings)

            const userInfo = await this.userService.createUser()

            profile = this.userProfileRepository.create({ email, user_info: userInfo, settings })


            await this.userProfileRepository.save(profile)
        }

        return profile
    }

    async removeProfile(id: number): Promise<void> {
        const profile = await this.userProfileRepository.findOne({
            where: { id },
            relations: ['user_info', 'user_info.about_info', 'settings']
        })

        if (!profile) {
            throw new Error('Профиль не найден')
        }

        await this.userProfileRepository.remove(profile)
    }
}

import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MediaEntitySourceType } from '@services/media/info/entities/media.entity'
import { Repository } from 'typeorm'
import { UserInfo } from './entities/user.entity'
import { GetUsersDto } from './dto/get-users.dto'
import { RequestParams } from 'src/shared/decorators'
import { UpdateUserDto } from './dto/update-users.dto'
import { UserAbout } from './entities'
import { CreateUserDto } from './dto/create-user.dto'
import { createPaginationResponse, createPaginationQueryOptions } from '@shared/utils'
import { pick, forIn, omit, pickBy, isEmpty, values, size } from 'lodash'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { UserStatus } from '@services/users/_interfaces'

type UpdateUserInfo = UpdateUserDto & { profileImage?: Express.Multer.File, bannerImage?: Express.Multer.File }

@Injectable()
export class UserInfoService {
    constructor(
        @InjectRepository(UserInfo)
        private userInfoRepository: Repository<UserInfo>,
        @InjectRepository(UserAbout)
        private userAboutRepository: Repository<UserAbout>,
        @Inject(forwardRef(() => MediaInfoService))
        private mediaInfoService: MediaInfoService,
    ) {}

    /**
     * Создать информацию о пользователе
     */
    async createUser(data?: CreateUserDto): Promise<UserInfo> {
        if (data) {
            const findUser = await this.userInfoRepository.findOne({ where: data })
            if (findUser) {
                throw new Error('Такой пользователь уже существует')
            }
        }


        const userInfo = await this.userInfoRepository.create(data)

        const userAbout = await this.userAboutRepository.create()
        await this.userAboutRepository.save(userAbout)

        userInfo.about_info = userAbout

        return await this.userInfoRepository.save(userInfo)
    }

    /**
     * Получить всех пользователей
     */
    async getUsers(query: GetUsersDto, params: RequestParams) {
        const { user_info_id, profile_id } = params
        const [users, total] = await this.userInfoRepository.findAndCount(
            createPaginationQueryOptions<UserInfo>({ query, options:{ relations: ['about_info'] }})
        )

        return createPaginationResponse({ data: users, total, query })
    }

    async getUsersById(id: number) {
        const user = await this.userInfoRepository.findOne({ where: { id } })

        return user
    }

    async getUsersByParams(query: GetUsersDto, params?: RequestParams) {
        const { public_id, name } = query
        const user = await this.userInfoRepository.findOne({ where: { public_id, name } })

        return user
    }

    /**
     * Обновить информацию о пользователе
     */
    async updateUserInfo(data: UpdateUserInfo, params: RequestParams): Promise<UserInfo> {
        const findUser = await this.userInfoRepository.findOne({
            where: { id: params.user_info_id },
        })

        if (!findUser) throw new Error('Пользователь не найден')

        const uploadImages = pick(data, ['profileImage', 'bannerImage'])

        // Загружаем изображения если они есть
        if (size(uploadImages)) {
            const filesToUpload = pickBy(uploadImages, (file) => !isEmpty(file))

            const uploadedFiles = await this.mediaInfoService.uploadFiles(
                values(filesToUpload),
                params.user_info_id,
                MediaEntitySourceType.USER_INFO
            )

            forIn(filesToUpload, (file, key) => {
                if (key === 'profileImage') {
                    findUser.profile_image = uploadedFiles[0].meta.src
                } else if (key === 'bannerImage') {
                    findUser.about_info = findUser.about_info || new UserAbout()
                    findUser.about_info.banner_image = uploadedFiles[data.profileImage ? 1 : 0].meta.src
                }
            })
        }

        // Если обновляем фото профиля
        if (data.profile_image_id) {
            const { meta } = await this.mediaInfoService.getFileById(data.profile_image_id)
            findUser.profile_image = meta.src
        }
        // Если обновляем фото баннера
        if (data.banner_image_id) {
            const { meta } = await this.mediaInfoService.getFileById(data.banner_image_id)
            findUser.about_info.banner_image = meta.src
        }

        // Обновляем все поля текущей таблицы кроме изображений
        const updateParams = omit(
            data,
            ['profileImage', 'bannerImage', 'about_info', 'profile_image_id']
        )

        if (size(updateParams)){
            forIn(updateParams, (value, key) => {
                if (value !== undefined) {
                    findUser[key] = value
                }
            })
        }

        // Обновляем все поля вложенной таблицы
        if (data.about_info) {
            findUser.about_info = findUser.about_info || new UserAbout()
            forIn(data.about_info, (value, key) => {
                if (value !== undefined) {
                    findUser['about_info'][key] = value
                }
            })
        }

        return await this.userInfoRepository.save(findUser)
    }

    async getUserReactions(userId: number) {
        const user = await this.userInfoRepository.findOne({
            where: { id: userId },
            relations: ['reactions', 'reactions.message'],
        })

        if (!user) {
            throw new NotFoundException(`Пользователь с ID "${userId}" не найден`)
        }

        return user.reactions
    }

    /**
     * Обновить статус пользователя
     */
    async updateUserStatus(userId: number, status: UserStatus) {
        const user = await this.userInfoRepository.findOne({ where: { id: userId } })
        if (!user) {
            throw new NotFoundException(`Пользователь с ID "${userId}" не найден`)
        }

        user.status = status
        return await this.userInfoRepository.save(user)
    }
}

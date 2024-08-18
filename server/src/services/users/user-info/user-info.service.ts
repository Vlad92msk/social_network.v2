import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from './entities/user.entity';
import { GetUsersDto } from "./dto/getUsers.dto";
import { RequestParams } from "src/shared/decorators";
import { UpdateUserDto } from "./dto/updateUsers.dto";
import { UserAbout } from "./entities";
import { CreateUserDto } from "./dto/createUser.dto";
import { createPaginationResponse, createPaginationQueryOptions } from "@shared/utils";
import { pick, forIn, omit, pickBy, isEmpty, values, size } from 'lodash';
import { MediaInfoService } from "@services/media/info/media-info.service";

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
            const findUser = await this.userInfoRepository.findOne({ where: data });
            if (findUser) {
                throw new Error('Такой пользователь уже существует');
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
        const { user_info_id, profile_id } = params;
        const [users, total] = await this.userInfoRepository.findAndCount(
            createPaginationQueryOptions<UserInfo>({ query, options:{ relations: ['about_info'] }})
        );

        return createPaginationResponse({ data: users, total, query })
    }

    async getUsersById(id: number) {
        const user = await this.userInfoRepository.findOne({ where: { id } });

        return user;
    }

    /**
     * Обновить информацию о пользователе
     */
    async updateUserInfo(data: UpdateUserInfo, params: RequestParams): Promise<UserInfo> {
        const findUser = await this.userInfoRepository.findOne({
            where: { id: params.user_info_id },
            relations: ['about_info'],
        });

        if (!findUser) throw new Error('Пользователь не найден');

        const uploadImages = pick(data, ['profileImage', 'bannerImage'])

        // Загружаем изображения если они есть
        if (size(uploadImages)) {
            const filesToUpload = pickBy(uploadImages, (file) => !isEmpty(file));

            const uploadedFiles = await this.mediaInfoService.uploadFiles(
                values(filesToUpload),
                params.user_info_id
            );

            forIn(filesToUpload, (file, key) => {
                if (key === 'profileImage') {
                    findUser.profile_image = uploadedFiles[0].meta.src;
                } else if (key === 'bannerImage') {
                    findUser.about_info = findUser.about_info || new UserAbout();
                    findUser.about_info.banner_image = uploadedFiles[data.profileImage ? 1 : 0].meta.src;
                }
            });
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
            findUser.about_info = findUser.about_info || new UserAbout();
            forIn(data.about_info, (value, key) => {
                if (value !== undefined) {
                    findUser['about_info'][key] = value
                }
            })
        }

        return await this.userInfoRepository.save(findUser);
    }
}

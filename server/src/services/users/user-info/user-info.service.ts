import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from './entities/user.entity';
import { GetUsersDto } from "./dto/getUsers.dto";
import { RequestParams } from "src/shared/decorators";
import { UpdateUserDto } from "./dto/updateUsers.dto";
import { UserAbout } from "./entities";
import { CreateUserDto } from "./dto/createUser.dto";
import { createPaginationResponse, createPaginationQueryOptions } from "@shared/utils";
import { pick, forIn, omit, pickBy, isEmpty, values } from 'lodash';
import { MediaInfoService } from "@services/media/info/media-info.service";

type UpdateUserInfo = UpdateUserDto & { profileImage?: Express.Multer.File, bannerImage?: Express.Multer.File }

@Injectable()
export class UserInfoService {
    constructor(
        @InjectRepository(UserInfo)
        private userInfoRepository: Repository<UserInfo>,
        @InjectRepository(UserAbout)
        private userAboutRepository: Repository<UserAbout>,
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

    async getUsersById(public_id: string) {
        const user = await this.userInfoRepository.findOne({ where: { public_id } });

        return user;
    }

    /**
     * Обновить информацию о пользователе
     */
    async updateUserInfo(data: UpdateUserInfo, params: RequestParams): Promise<UserInfo> {
        const findUser = await this.userInfoRepository.findOne({
            where: { public_id: String(params.user_info_id) },
            relations: ['about_info'],
        });

        if (!findUser) throw new Error('Пользователь не найден');

        // Загружаем изображения если они есть
        const filesToUpload = pickBy(
            pick(data, ['profileImage', 'bannerImage']),
            (file) => !isEmpty(file)
        );

        const uploadedFiles = await this.mediaInfoService.uploadFiles(
            // @ts-ignore
            values(filesToUpload),
            String(params.user_info_id)
        );

        forIn(filesToUpload, (file, key) => {
            if (key === 'profileImage') {
                findUser.profile_image = uploadedFiles[0].filePath;
            } else if (key === 'bannerImage') {
                findUser.about_info = findUser.about_info || new UserAbout();
                findUser.about_info.banner_image = uploadedFiles[data.profileImage ? 1 : 0].filePath;
            }
        });

        // Обновляем все поля текущей таблицы кроме изображений
        const updateParams = omit(data, ['profileImage', 'bannerImage', 'about_info']);
        forIn(updateParams, (value, key) => {
            if (value !== undefined) {
                findUser[key] = value
            }
        })

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

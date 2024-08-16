import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from './entities/user.entity';
import { GetUsersDto } from "./dto/getUsers.dto";
import { RequestParams } from "src/shared/decorators";
import { UpdateUserDto } from "./dto/updateUsers.dto";
import { ResponseWithPagination } from "src/shared/types";
import { UserAbout } from "./entities";
import { CreateUserDto } from "./dto/createUser.dto";
import { createPaginationResponse, createPaginationQueryOptions } from "@shared/utils";
import { isEmpty, size } from "lodash";

@Injectable()
export class UserInfoService {
    constructor(
        @InjectRepository(UserInfo)
        private userInfoRepository: Repository<UserInfo>,
        @InjectRepository(UserAbout)
        private userAboutRepository: Repository<UserAbout>,
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
    async updateUserInfo(data: UpdateUserDto, params: RequestParams): Promise<UserInfo> {
        const findUser = await this.userInfoRepository.findOne({
            where: { public_id: data.public_id },
            relations: ['about_info'],
        });

        if (!findUser) {
            throw new Error('User not found');
        }

        // Обновляем данные в основной таблице UserInfo
        findUser.name = data.name || findUser.name;
        findUser.profile_image = data.profile_image || findUser.profile_image;

        // Обновляем данные в связанной таблице UserAbout
        if (data.about_info) {
            findUser.about_info = findUser.about_info || new UserAbout();
            findUser.about_info.study = data.about_info.study || findUser.about_info.study;
            findUser.about_info.working = data.about_info.working || findUser.about_info.working;
            findUser.about_info.position = data.about_info.position || findUser.about_info.position;
            findUser.about_info.description = data.about_info.description || findUser.about_info.description;
            findUser.about_info.banner_image = data.about_info.banner_image || findUser.about_info.banner_image;
        }

        return await this.userInfoRepository.save(findUser);
    }
}

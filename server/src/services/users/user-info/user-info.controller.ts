import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Put,
    Query,
    Res,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common'
import { UserInfoService } from './user-info.service'
import { RequestParams } from 'src/shared/decorators'
import { UserInfoType } from '../_interfaces'
import { GetUsersDto } from './dto/getUsers.dto'
import { UpdateUserDto } from './dto/updateUsers.dto'
import { Response } from 'express'
import { createPaginationHeaders } from '@shared/utils'
import { FileFieldsInterceptor } from '@nestjs/platform-express'

@Controller('api/users/user-info')
export class UserInfoController {
    constructor(private readonly userService: UserInfoService) {}

    /**
     * Получить всех user-info
     */
    @Get()
    async getUsers(
        @Query() query: GetUsersDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ): Promise<UserInfoType[]> {
        const { data, paginationInfo } = await this.userService.getUsers(query, params)

        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    /**
     * Получить одного user-info по его public_id
     */
    @Get(':user_id')
    async getUserById(
        @Param('user_id') id: number,
        @RequestParams() params: RequestParams,
    ): Promise<UserInfoType> {
        console.log('Запрашиваем пользователя', id)
        const user = await this.userService.getUsersById(id)
        return user
    }

    /**
     * Обновить user-info
     */
    @Put()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'profile_image', maxCount: 1 },
        { name: 'banner_image', maxCount: 1 }
    ]))
    async updateUser(
        @RequestParams() params: RequestParams,
        @Body() data: UpdateUserDto,
        @UploadedFiles() files: {
            profile_image?: Express.Multer.File,
            banner_image?: Express.Multer.File
        }
    ) {

        try {
            const profileImage = files.profile_image?.[0]
            const bannerImage = files.banner_image?.[0]

            const user = await this.userService.updateUserInfo({ ...data, profileImage, bannerImage }, params)
            return user
        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }
}

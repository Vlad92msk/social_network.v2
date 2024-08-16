import {
    BadRequestException,
    Body,
    Controller,
    ForbiddenException,
    Get,
    Param,
    ParseFilePipe,
    Put,
    Query,
    Res,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common';
import { UserInfoService } from './user-info.service';
import { RequestParams } from "src/shared/decorators";
import { UserInfoType } from "../_interfaces";
import { GetUsersDto } from "./dto/getUsers.dto";
import { UpdateUserDto } from "./dto/updateUsers.dto";
import { Response } from "express";
import { createPaginationHeaders } from "@shared/utils";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImageValidator } from "@services/media/info/decorators";

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

        response.set(createPaginationHeaders(paginationInfo));
        return data;
    }

    /**
     * Изменить одного user-info
     */
    @Put(':public_id')
    @UseInterceptors(FileInterceptor('profileImage'))
    async updateUser(
        @Param('public_id') public_id: string,
        @RequestParams() params: RequestParams,
        @Body() data: UpdateUserDto,
        @UploadedFile(
            new ParseFilePipe({
                validators: [new ImageValidator({ maxSize: 10 * 1024 * 1024 })],
                fileIsRequired: false,
            }),
        )
            profileImage?: Express.Multer.File,
        @UploadedFile(
            new ParseFilePipe({
                validators: [new ImageValidator({ maxSize: 10 * 1024 * 1024 })],
                fileIsRequired: false,
            }),
        )
            bannerImage?: Express.Multer.File,
    ) {
        console.log('public_id', public_id)
        console.log('data', data)
        console.log('params', params)
        if (public_id !== params.user_info_id) {
            throw new ForbiddenException('Вы не можете изменить данные другого пользователя');
        }

        try {
            const user = await this.userService.updateUserInfo({ ...data, profileImage, bannerImage }, params);
            return user;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Получить одного user-info по его public_id
     */
    @Get(':public_id')
    async getUserById(
        @Param('public_id') id: string,
        @RequestParams() params: RequestParams,
    ): Promise<UserInfoType> {
        console.log("Запрашиваем пользователя", id);
        const user = await this.userService.getUsersById(id)
        return user;
    }
}

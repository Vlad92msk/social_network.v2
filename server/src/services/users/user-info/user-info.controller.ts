import { Controller, Get, Param, Query, UsePipes, ValidationPipe, Res, Put, Body } from '@nestjs/common';
import { UserInfoService } from './user-info.service';
import { RequestParams } from "src/shared/decorators";
import { UserInfoType } from "@src/services/users/_interfaces";
import { GetUsersDto } from "./dto/getUsers.dto";
import { UpdateUserDto } from "./dto/updateUsers.dto";
import { Response } from "express";
import { createPaginationHeaders } from "@shared/utils";

@Controller('api/users/user-info')
export class UserInfoController {
    constructor(private readonly userService: UserInfoService) {}

    @Get()
    @UsePipes(new ValidationPipe())
    async getUsers(
        @Query() query: GetUsersDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ): Promise<UserInfoType[]> {
        const { data, paginationInfo } = await this.userService.getUsers(query, params)

        response.set(createPaginationHeaders(paginationInfo));
        return data;
    }

    @Get(':public_id')
    @UsePipes(new ValidationPipe())
    async getUserById(
        @Param('public_id') id: string,
        @RequestParams() params: RequestParams,
    ): Promise<UserInfoType> {
        console.log("Запрашиваем пользователя", id);
        const user = await this.userService.getUsersById(id)
        return user;
    }

    @Put(':public_id')
    @UsePipes(new ValidationPipe())
    async updateUser(
        @Body() data: UpdateUserDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ): Promise<UserInfoType | Error> {
        if (data.public_id !== params.user_info_id) return new Error('Вы не можете изменить данные чужому пользователю')
        const user = await this.userService.updateUserInfo(data, params)
        return user;
    }
}

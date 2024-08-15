import { Controller, Get, Param, Query, UsePipes, ValidationPipe, Res, Put, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { RequestParams } from "src/shared/decorators";
import { UserInfoType } from "@src/services/users/_interfaces";
import { GetUsersDto } from "./dto/getUsers.dto";
import { UpdateUserDto } from "./dto/updateUsers.dto";
import { Response } from "express";

@Controller('api/users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @UsePipes(new ValidationPipe())
    async getUsers(
        @Query() query: GetUsersDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ): Promise<UserInfoType[]> {
        const { data, pages, per_page, current_page, count_elements } = await this.userService.getUsers(query, params)

        response.set({
            'X-Total-Count': count_elements,
            'X-Total-Pages': pages,
            'X-Current-Page': current_page,
            'X-Per-Page': per_page,
        });
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

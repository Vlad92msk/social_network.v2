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
import { GetUsersDto } from './dto/get-users.dto'
import { UpdateUserDto } from './dto/update-users.dto'
import { Response } from 'express'
import { createPaginationHeaders } from '@shared/utils'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserInfoDto } from "@services/users/user-info/dto/user-info.dto";

@ApiTags('Инф о пользователе')
@Controller('api/users/user-info')
export class UserInfoController {
    constructor(private readonly userService: UserInfoService) {}

    @Get()
    @ApiOperation({ summary: 'Получить всех пользователей' })
    @ApiQuery({ type: GetUsersDto })
    @ApiResponse({
        status: 200,
        description: 'Возвращает массив пользователей',
        type: UserInfoDto,
        isArray: true
    })
    async getUsers(
        @Query() query: GetUsersDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const { data, paginationInfo } = await this.userService.getUsers(query, params)

        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Get(':user_id')
    @ApiOperation({ summary: 'Получить пользователя по ID' })
    @ApiParam({ name: 'user_id', type: 'number', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Возвращает информацию о пользователе', type: UserInfoDto })
    async getUserById(
        @Param('user_id') id: number,
        @RequestParams() params: RequestParams,
    ) {
        console.log('Запрашиваем пользователя', id)
        const user = await this.userService.getUsersById(id)
        return user
    }

    @Put()
    @ApiOperation({ summary: 'Обновить информацию о пользователе' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateUserDto, description: 'Данные для обновления пользователя' })
    @ApiResponse({ status: 200, description: 'Возвращает обновленную информацию о пользователе', type: UserInfoDto })
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

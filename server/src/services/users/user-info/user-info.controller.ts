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
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserInfoDto } from '@services/users/user-info/dto/user-info.dto';
import { UserInfo } from '@services/users/user-info/entities';
import { createPaginationHeaders } from '@shared/utils';
import { Response } from 'express';
import { RequestParams } from 'src/shared/decorators';

import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { UserInfoService } from './user-info.service';

@ApiTags('Инф о пользователе')
@Controller('api/users/user-about')
export class UserInfoController {
  constructor(private readonly userService: UserInfoService) {}

  @Get()
  @ApiOperation({ summary: 'Получить всех пользователей' })
  @ApiQuery({ type: GetUsersDto })
  @ApiResponse({
    status: 200,
    description: 'Возвращает массив пользователей',
    type: UserInfoDto,
    isArray: true,
  })
  async getUsers(
    @Query() query: GetUsersDto,
    @RequestParams() params: RequestParams,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { data, paginationInfo } = await this.userService.getUsers(
      query,
      params,
    );

    response.set(createPaginationHeaders(paginationInfo));
    return data;
  }

  @Get('get_one')
  @ApiOperation({ summary: 'Получить пользователя по публичному ID' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает информацию о пользователе',
    type: UserInfoDto,
  })
  async getOneUserByParams(
    @Query() query: GetUsersDto,
    @RequestParams() params: RequestParams,
  ) {
    const user = await this.userService.getUsersByParams(query, params);
    return user;
  }

  @Get('get_one_by_id/:user_id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'user_id', type: 'number', description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает информацию о пользователе',
    type: UserInfoDto,
  })
  async getUserById(
    @Param('user_id') id: number,
    @RequestParams() params: RequestParams,
  ) {
    console.log('Запрашиваем пользователя', id);
    const user = await this.userService.getUsersById(id);
    return user;
  }

  @Put()
  @ApiOperation({ summary: 'Обновить информацию о пользователе' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateUserDto,
    description: 'Данные для обновления пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращает обновленную информацию о пользователе',
    type: UserInfo,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profile_image', maxCount: 1 },
      { name: 'banner_image', maxCount: 1 },
    ]),
  )
  async updateUser(
    @RequestParams() params: RequestParams,
    @Body() data: UpdateUserDto,
    @UploadedFiles()
    files?: {
      profile_image?: Express.Multer.File[];
      banner_image?: Express.Multer.File[];
    },
  ) {
    try {
      const profileImage = files?.profile_image && files.profile_image[0];
      const bannerImage = files?.banner_image && files.banner_image[0];

      const userData = {
        ...data,
        ...(profileImage && { profileImage }),
        ...(bannerImage && { bannerImage }),
      };

      const user = await this.userService.updateUserInfo(userData, params);
      console.log('user__', user);
      return user;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw new BadRequestException(
        `Ошибка при обновлении информации о пользователе: ${error.message}`,
      );
    }
  }
}

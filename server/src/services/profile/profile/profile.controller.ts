import { Controller, Post, Body, UsePipes, ValidationPipe, Res, Delete, Get, Put } from '@nestjs/common'
import { ProfileService } from './profile.service'
import { UserProfileInfo } from './entities/profileInfo.entity'
import { CreateProfileDto } from './dto/create-profile.dto'
import { Response } from 'express'
import { RequestParams } from 'src/shared/decorators'
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Профиль')
@Controller('api/profile')
export class ProfileController {
    constructor(private profileService: ProfileService) {}

    private clearCookie(res: Response, name: string) {
        res.clearCookie(name, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        })
    }

    @Post()
    @ApiOperation({ summary: 'Создать/получить профиль по email' })
    @ApiBody({ type: CreateProfileDto })
    @ApiResponse({ status: 200, description: 'Профиль успешно создан/получен', type: UserProfileInfo })
    @UsePipes(new ValidationPipe())
    async getProfileInfo(
        @Body() createProfileDto: CreateProfileDto,
        @Res({ passthrough: true }) response: Response
    ){
        const profile = await this.profileService.getProfileInfo(createProfileDto.email)

        response.cookie('profile_id', profile.id, { httpOnly: true })
        response.cookie('user_info_id', profile.user_info.id, { httpOnly: true })

        return profile
    }

    @Get()
    @ApiOperation({ summary: 'Получить все профили' })
    @ApiResponse({ status: 200, description: 'Список всех профилей', type: [UserProfileInfo] })
    async getProfiles() {
        return await this.profileService.getProfiles()
    }

    @Delete()
    @ApiOperation({ summary: 'Удалить профиль' })
    @ApiCookieAuth()
    @ApiResponse({ status: 200, description: 'Профиль успешно удален' })
    @UsePipes(new ValidationPipe())
    async removeProfile(
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ){
        await this.profileService.removeProfile(params.profile_id)
        this.clearCookie(response, 'profile_id')
        this.clearCookie(response, 'user_info_id')

        response.status(200)
        return { message: 'Профиль успешно удален' }
    }
}

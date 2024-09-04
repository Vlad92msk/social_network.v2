import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseInterceptors,
    UploadedFiles,
    Query,
    Res, BadRequestException
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { Response } from 'express'
import { DialogService } from './dialog.service'
import { CreateDialogDto } from './dto/create-dialog.dto'
import { UpdateDialogDto } from './dto/update-dialog.dto'
import { FindDialogDto } from './dto/find-dialog.dto'
import { DialogEntity } from './entities/dialog.entity'
import { RequestParams } from '@shared/decorators'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { ConfigService } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'
import { createPaginationHeaders } from '@shared/utils'

@ApiTags('Диалоги')
@Controller('api/dialogs')
export class DialogController {
    private readonly maxStorage: number

    constructor(
        private readonly dialogService: DialogService,
        private readonly mediaInfoService: MediaInfoService,
        private readonly configService: ConfigService,
    ) {
        this.maxStorage = this.configService.get(`${ConfigEnum.MAIN}.maxUserStorage`)
    }

    @Post()
    @ApiOperation({ summary: 'Создать диалог' })
    @ApiResponse({ status: 201, description: 'Диалог успешно создан', type: DialogEntity })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'image', maxCount: 1 }
    ]))
    async create(
        @Body() createDialogDto: CreateDialogDto,
        @UploadedFiles() files: { image?: Express.Multer.File[] },
        @RequestParams() params: RequestParams,
    ) {
        await this.mediaInfoService.checkStorageLimit(
            params.user_info_id,
            files?.image || [],
            this.maxStorage
        )

        return this.dialogService.create({
            createDialogDto,
            image: files?.image?.[0]
        }, params)
    }

    @Get()
    @ApiOperation({ summary: 'Найти все диалоги' })
    @ApiResponse({ status: 200, description: 'Список диалогов', type: [DialogEntity] })
    async findAll(
        @Query() query: FindDialogDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ): Promise<DialogEntity[]> {
        const { data, paginationInfo } = await this.dialogService.findAll(query, params)
        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Get(':id')
    @ApiOperation({ summary: 'Найти диалог по ID' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Диалог найден', type: DialogEntity })
    async findOne(@Param('id') id: string) {
        return this.dialogService.findOne(id)
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Обновить диалог' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Диалог успешно обновлен', type: DialogEntity })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'image', maxCount: 1 }
    ]))
    async update(
        @Param('id') id: string,
        @Body() updateDialogDto: UpdateDialogDto,
        @UploadedFiles() files: { image?: Express.Multer.File[] },
        @RequestParams() params: RequestParams,
    ) {
        if (files?.image) {
            await this.mediaInfoService.checkStorageLimit(
                params.user_info_id,
                files.image,
                this.maxStorage
            )
        }

        return this.dialogService.update(id, {
            updateDialogDto,
            image: files?.image?.[0]
        }, params)
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить диалог' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Диалог успешно удален' })
    async remove(@Param('id') id: string, @RequestParams() params: RequestParams) {
        return this.dialogService.remove(id, params)
    }

    @Post(':id/participants/:user_id')
    @ApiOperation({ summary: 'Добавить участника в диалог' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'user_id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Участник успешно добавлен', type: DialogEntity })
    addParticipant(
        @Param('id') id: string,
        @Param('user_id') userId: number,
        @RequestParams() params: RequestParams,
    ) {
        return this.dialogService.addParticipant(id, userId, params)
    }

    @Delete(':id/participants/:user_id')
    @ApiOperation({ summary: 'Удалить участника из диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'user_id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Участник успешно удален', type: DialogEntity })
    removeParticipant(
        @Param('id') id: string,
        @Param('user_id') userId: number,
        @RequestParams() params: RequestParams,
    ) {
        return this.dialogService.removeParticipant(id, userId, params)
    }

    @Post(':id/admins/:user_id')
    @ApiOperation({ summary: 'Добавить администратора в диалог' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'user_id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Администратор успешно добавлен', type: DialogEntity })
    addAdmin(
        @Param('id') id: string,
        @Param('user_id') userId: number,
        @RequestParams() params: RequestParams,
    ) {
        return this.dialogService.addAdmin(id, userId, params)
    }

    @Delete(':id/admins/:user_id')
    @ApiOperation({ summary: 'Удалить администратора из диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'user_id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Администратор успешно удален', type: DialogEntity })
    removeAdmin(
        @Param('id') id: string,
        @Param('user_id') userId: number,
        @RequestParams() params: RequestParams,
    ) {
        return this.dialogService.removeAdmin(id, userId, params)
    }

    @Post(':id/fixed-messages/:message_id')
    @ApiOperation({ summary: 'Закрепить сообщение в диалоге' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'message_id', description: 'ID сообщения' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно закреплено', type: DialogEntity })
    addFixedMessage(
        @Param('id') id: string,
        @Param('message_id') messageId: string,
        @RequestParams() params: RequestParams,
    ) {
        return this.dialogService.addFixedMessage(id, messageId, params)
    }

    @Delete(':id/fixed-messages/:message_id')
    @ApiOperation({ summary: 'Открепить сообщение в диалоге' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'message_id', description: 'ID сообщения' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно откреплено', type: DialogEntity })
    removeFixedMessage(
        @Param('id') id: string,
        @Param('message_id') messageId: string,
        @RequestParams() params: RequestParams,
    ) {
        return this.dialogService.removeFixedMessage(id, messageId, params)
    }

    @Get(':id/unread-count')
    @ApiOperation({ summary: 'Получить количество непрочитанных сообщений в диалоге' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Количество непрочитанных сообщений', type: Number })
    getUnreadMessagesCount(
        @Param('id') id: string,
        @RequestParams() params: RequestParams,
    ) {
        return this.dialogService.getUnreadMessagesCount(id, params.user_info_id)
    }

    @Post(':id/mark-as-read')
    @ApiOperation({ summary: 'Отметить все сообщения в диалоге как прочитанные' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Сообщения отмечены как прочитанные', type: DialogEntity })
    markMessagesAsRead(
        @Param('id') id: string,
        @RequestParams() params: RequestParams,
    ) {
        return this.dialogService.markMessagesAsRead(id, params.user_info_id)
    }

    @Get(':id/media')
    @ApiOperation({ summary: 'Получение всех медиафайлов диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Список медиафайлов диалога', type: [Object] })
    async getAllMediaForDialog(@Param('id') id: string) {
        return this.dialogService.getAllMediaForDialog(id)
    }

    @Patch(':id/image')
    @ApiOperation({ summary: 'Обновить изображение диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Изображение диалога обновлено', type: DialogEntity })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'image', maxCount: 1 }
    ]))
    async updateDialogImage(
        @Param('id') id: string,
        @UploadedFiles() files: { image?: Express.Multer.File[] },
        @RequestParams() params: RequestParams,
    ) {
        if (!files.image || files.image.length === 0) {
            throw new BadRequestException('Изображение не предоставлено')
        }

        // Проверяем квоту
        if (files?.image) {
            await this.mediaInfoService.checkStorageLimit(
                params.user_info_id,
                files.image,
                this.maxStorage
            )
        }
        return this.dialogService.updateDialogImage(id, files.image[0], params)
    }

    @Patch(':id/options')
    @ApiOperation({ summary: 'Обновление настроек диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiBody({ description: 'Новые настройки', type: Object })
    @ApiResponse({ status: 200, description: 'Настройки диалога обновлены', type: DialogEntity })
    async updateDialogOptions(
        @Param('id') id: string,
        @Body('options') options: { hide_me?: boolean; notify?: boolean },
        @RequestParams() params: RequestParams
    ) {
        return this.dialogService.updateDialogOptions(id, options, params.user_info_id)
    }

    @Get('by-participant/:user_id')
    @ApiOperation({ summary: 'Получение диалогов по участнику' })
    @ApiParam({ name: 'user_id', description: 'ID участника' })
    @ApiResponse({ status: 200, description: 'Список диалогов', type: [DialogEntity] })
    async getDialogsByParticipant(@Param('user_id') userId: number) {
        return this.dialogService.getDialogsByParticipant(userId)
    }

    @Get(':id/participants')
    @ApiOperation({ summary: 'Получение участников диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Список участников', type: [Object] })
    async getDialogParticipants(@Param('id') id: string) {
        return this.dialogService.getDialogParticipants(id)
    }

    @Get(':id/admins')
    @ApiOperation({ summary: 'Получение администраторов диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Список администраторов', type: [Object] })
    async getDialogAdmins(@Param('id') id: string) {
        return this.dialogService.getDialogAdmins(id)
    }

    @Post(':id/leave')
    @ApiOperation({ summary: 'Покинуть диалог' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Пользователь успешно покинул диалог' })
    async leaveDialog(
        @Param('id') id: string,
        @RequestParams() params: RequestParams
    ) {
        return this.dialogService.leaveDialog(id, params.user_info_id)
    }

    @Post(':id/video-conference')
    @ApiOperation({ summary: 'Запустить видео-конференцию' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Ссылка на комнату', type: String })
    async createVideoConference(@Param('id') id: string, @RequestParams() req: RequestParams) {
        return this.dialogService.createVideoConference(id, req.user_info_id);
    }
}

import { ConfigEnum } from '@config/config.enum'
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFiles, UseInterceptors } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { DialogEvents } from '@services/messenger/dialog/types'
import { CreateMessageDto } from '@services/messenger/message/dto/create-message.dto'
import { MessageEntity } from '@services/messenger/message/entity/message.entity'
import { MessageService } from '@services/messenger/message/message.service'
import { UserInfo } from '@services/users/user-info/entities'
import { RequestParams } from '@shared/decorators'
import { createPaginationHeaders } from '@shared/utils'
import { Response } from 'express'
import { DialogService } from './dialog.service'
import { CreateDialogDto } from './dto/create-dialog.dto'
import { FindDialogDto } from './dto/find-dialog.dto'
import { UpdateDialogDto } from './dto/update-dialog.dto'
import { DialogEntity } from './entities/dialog.entity'

@ApiTags('Диалоги')
@Controller('api/dialogs')
export class DialogController {
    private readonly maxStorage: number

    constructor(
        private readonly dialogService: DialogService,
        private readonly mediaInfoService: MediaInfoService,
        private readonly configService: ConfigService,
        private messageService: MessageService,
        private eventEmitter: EventEmitter2,
    ) {
        this.maxStorage = this.configService.get(`${ConfigEnum.MAIN}.maxUserStorage`)
    }

    @Post('send-message/:dialog_id')
    @ApiOperation({ summary: 'Отправить сообщение в диалог' })
    @ApiParam({ name: 'dialog_id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Отправляет сообщение в диалог', type: MessageEntity })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'media', maxCount: 20 },
        { name: 'voices', maxCount: 5 },
        { name: 'videos', maxCount: 5 }
    ]))
    async sendMessage(
      @Param('dialog_id') dialogId: string,
      @Body() data: CreateMessageDto,
      @UploadedFiles() files: {
          media?: Express.Multer.File[],
          voices?: Express.Multer.File[],
          videos?: Express.Multer.File[]
      },
      @RequestParams() params: RequestParams,
    ) {
        // Проверяем квоту
        await this.mediaInfoService.checkStorageLimit(
          params.user_info_id,
          [].concat(files?.media, files?.voices, files?.videos).filter(Boolean),
          this.maxStorage
        )

        const isNewDialog = dialogId === 'new'

        // console.log('Принимаем такое сообщение', data)
        let currentDialog: DialogEntity

        // Добавляем сообщение в существующий диалог или создаем новый
        if (isNewDialog) {
            // Создаем новый диалог
            if (data?.participants) {
                currentDialog = await this.dialogService.create({ query: { participants: data.participants } }, params)
            } else {
                currentDialog = await this.dialogService.create(undefined, params)
            }
        } else {
            currentDialog = await this.dialogService.findOne(dialogId)
        }


        if (!currentDialog.participants.some(participant => participant.id === params.user_info_id)) {
            throw new BadRequestException('Вы не являетесь участником этого диалога')
        }

        // Создаем сообщение
        const message = await this.messageService.create(
          {
              createMessageDto: data,
              media: files.media,
              voices: files.voices,
              videos: files.videos,
          },
          params
        )

        // Добавляем созданное сообщение в диалог
        const currentDialogWithMessage = await this.dialogService.addMessageToDialog(currentDialog.id, message, params)

        const lastMessage = await this.dialogService.getLastMessage(currentDialog.id)

        // Создаем из него краткую форму
        const updatedDialogShort = this.dialogService.mapToDialogShortDto({dialog: currentDialogWithMessage, lastMessage}, params)


        // Оповещаем всех участников, что появилось новое сообщение
        this.eventEmitter.emit(
         DialogEvents.DIALOG_SHORT_UPDATED,
         {
             data: updatedDialogShort,
             participants: currentDialog.participants.map(({ id }) => id),
         })

        // Оповещаем всех кто находится в диалоге о новом сообщении
        this.eventEmitter.emit(
          DialogEvents.NEW_MESSAGE,
          {
              dialogId: updatedDialogShort.id,
              message,
              isNewDialog,
              creator: params
          })

        return message
    }

    @Post('create')
    @ApiOperation({ summary: 'Создать диалог' })
    @ApiResponse({ status: 201, description: 'Диалог успешно создан', type: DialogEntity })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'image', maxCount: 1 }
    ]))
    async create(
        @Body() query: CreateDialogDto,
        @UploadedFiles() files: { image?: Express.Multer.File[] },
        @RequestParams() params: RequestParams,
    ) {
        await this.mediaInfoService.checkStorageLimit(
            params.user_info_id,
            files?.image || [],
            this.maxStorage
        )

        const createdDialog = await this.dialogService.create({
            query,
            image: files?.image?.[0]
        }, params)

        // Создаем из него краткую форму
        const updatedDialogShort = this.dialogService.mapToDialogShortDto({ dialog: createdDialog }, params)


        // Оповещаем всех участников, что появилось новое сообщение
        this.eventEmitter.emit(
          DialogEvents.DIALOG_SHORT_UPDATED,
          {
              data: updatedDialogShort,
              participants: createdDialog.participants.map(({ id }) => id),
          })

        return createdDialog
    }

    @Get()
    @ApiOperation({ summary: 'Найти все диалоги' })
    @ApiResponse({ status: 200, description: 'Список диалогов', type: [DialogEntity] })
    async findAll(
        @Query() query: FindDialogDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
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
        @Body() query: UpdateDialogDto,
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

        const updatedDialog = await this.dialogService.update(id, {
            query,
            image: files?.image?.[0]
        }, params)


        // Оповещаем всех участников, что появилось новое сообщение
        this.eventEmitter.emit(
          DialogEvents.UPDATE_DIALOG_INFO,
          {
              data: updatedDialog,
              participants: updatedDialog.participants.map(({ id }) => id),
          })


      if (files?.image?.[0] || query.image || query.title || query.type) {
          // Создаем из него краткую форму
          const updatedDialogShort = this.dialogService.mapToDialogShortDto({ dialog: updatedDialog }, params)

          // Оповещаем всех участников, что появилось новое сообщение
          this.eventEmitter.emit(
            DialogEvents.DIALOG_SHORT_UPDATED,
            {
                data: updatedDialogShort,
                participants: updatedDialog.participants.map(({ id }) => id),
            })
      }

        return updatedDialog
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить диалог' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Диалог успешно удален' })
    async remove(@Param('id') id: string, @RequestParams() params: RequestParams) {
        return await this.dialogService.remove(id, params)
    }

    @Post(':id/participants/:user_id')
    @ApiOperation({ summary: 'Добавить участника в диалог' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'user_id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Участник успешно добавлен', type: DialogEntity })
    async addParticipant(
        @Param('id') id: string,
        @Param('user_id') userId: number,
        @RequestParams() params: RequestParams,
    ) {
        return await this.dialogService.addParticipant(id, userId, params)
    }

    @Delete(':id/participants/:user_id')
    @ApiOperation({ summary: 'Удалить участника из диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'user_id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Участник успешно удален', type: DialogEntity })
    async removeParticipant(
        @Param('id') id: string,
        @Param('user_id') userId: number,
        @RequestParams() params: RequestParams,
    ) {
        return await this.dialogService.removeParticipant(id, userId, params)
    }

    @Post(':id/admins/:user_id')
    @ApiOperation({ summary: 'Добавить администратора в диалог' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'user_id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Администратор успешно добавлен', type: DialogEntity })
    async addAdmin(
        @Param('id') id: string,
        @Param('user_id') userId: number,
        @RequestParams() params: RequestParams,
    ) {
        return await this.dialogService.addAdmin(id, userId, params)
    }

    @Delete(':id/admins/:user_id')
    @ApiOperation({ summary: 'Удалить администратора из диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'user_id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Администратор успешно удален', type: DialogEntity })
    async removeAdmin(
        @Param('id') id: string,
        @Param('user_id') userId: number,
        @RequestParams() params: RequestParams,
    ) {
        return await this.dialogService.removeAdmin(id, userId, params)
    }

    @Post(':id/fixed-messenger/:message_id')
    @ApiOperation({ summary: 'Закрепить сообщение в диалоге' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'message_id', description: 'ID сообщения' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно закреплено', type: DialogEntity })
    async addFixedMessage(
        @Param('id') id: string,
        @Param('message_id') messageId: string,
        @RequestParams() params: RequestParams,
    ) {
        return await this.dialogService.addFixedMessage(id, messageId, params)
    }

    @Delete(':id/fixed-messenger/:message_id')
    @ApiOperation({ summary: 'Открепить сообщение в диалоге' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiParam({ name: 'message_id', description: 'ID сообщения' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно откреплено', type: DialogEntity })
    async removeFixedMessage(
        @Param('id') id: string,
        @Param('message_id') messageId: string,
        @RequestParams() params: RequestParams,
    ) {
        return await this.dialogService.removeFixedMessage(id, messageId, params)
    }

    @Get(':id/unread-count')
    @ApiOperation({ summary: 'Получить количество непрочитанных сообщений в диалоге' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Количество непрочитанных сообщений', type: Number })
    async getUnreadMessagesCount(
        @Param('id') id: string,
        @RequestParams() params: RequestParams,
    ) {
        return await this.dialogService.getUnreadMessagesCount(id, params.user_info_id)
    }

    @Post(':id/mark-as-read')
    @ApiOperation({ summary: 'Отметить все сообщения в диалоге как прочитанные' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Сообщения отмечены как прочитанные', type: DialogEntity })
    async markMessagesAsRead(
        @Param('id') id: string,
        @RequestParams() params: RequestParams,
    ) {
        return await this.dialogService.markMessagesAsRead(id, params)
    }

    @Get(':id/media')
    @ApiOperation({ summary: 'Получение всех медиафайлов диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Список медиафайлов диалога' })
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
    @ApiBody({ description: 'Новые настройки' })
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
    @ApiResponse({ status: 200, description: 'Список участников', type: [UserInfo] })
    async getDialogParticipants(@Param('id') id: string) {
        return this.dialogService.getDialogParticipants(id)
    }

    @Get(':id/admins')
    @ApiOperation({ summary: 'Получение администраторов диалога' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Список администраторов', type: [UserInfo] })
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
        return await this.dialogService.exitFromDialog(id, params.user_info_id, params)
    }

    @Post(':id/video-conference')
    @ApiOperation({ summary: 'Запустить видео-конференцию' })
    @ApiParam({ name: 'id', description: 'ID диалога' })
    @ApiResponse({ status: 200, description: 'Ссылка на комнату', type: String })
    async createVideoConference(@Param('id') id: string, @RequestParams() req: RequestParams) {
        return this.dialogService.createVideoConference(id, req.user_info_id)
    }
}

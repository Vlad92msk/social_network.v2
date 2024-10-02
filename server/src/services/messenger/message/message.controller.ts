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
    Res
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MessageService } from './message.service'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateMessageDto } from './dto/update-message.dto'
import { FindMessageDto } from './dto/find-message.dto'
import { MessageEntity } from './entity/message.entity'
import { RequestParams } from '@shared/decorators'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { ConfigService } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'
import { Response } from 'express'
import { createPaginationHeaders } from '@shared/utils'

@ApiTags('Сообщения')
@Controller('messages')
export class MessageController {
    private readonly maxStorage: number

    constructor(
        private readonly messageService: MessageService,
        private readonly mediaInfoService: MediaInfoService,
        private readonly configService: ConfigService,
    ) {
        this.maxStorage = this.configService.get(`${ConfigEnum.MAIN}.maxUserStorage`)
    }

    @Post()
    @ApiOperation({ summary: 'Создать сообщение' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно создано', type: MessageEntity })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'media', maxCount: 20 },
        { name: 'voices', maxCount: 5 },
        { name: 'videos', maxCount: 5 }
    ]))
    async create(
        @Body() createMessageDto: CreateMessageDto,
        @UploadedFiles() files: {
            media?: Express.Multer.File[],
            voices?: Express.Multer.File[],
            videos?: Express.Multer.File[]
        },
        @RequestParams() params: RequestParams,
    ) {
        await this.mediaInfoService.checkStorageLimit(
            params.user_info_id,
            [].concat(files?.media, files?.voices, files?.videos).filter(Boolean),
            this.maxStorage
        )

        return this.messageService.create({
            createMessageDto,
            media: files?.media,
            voices: files?.voices,
            videos: files?.videos
        }, params)
    }

    @Get()
    @ApiOperation({ summary: 'Получить список сообщений' })
    @ApiResponse({ status: 200, description: 'Список сообщений успешно получен', type: [MessageEntity] })
    async findAll(
        @Query() query: FindMessageDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const { data, paginationInfo } = await this.messageService.findAll(query, params)

        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить сообщение по ID' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно получено', type: MessageEntity })
    async findOne(@Param('id') id: string) {
        return await this.messageService.findOne(id)
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Обновить сообщение' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно обновлено', type: MessageEntity })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'media', maxCount: 20 },
        { name: 'voices', maxCount: 5 },
        { name: 'videos', maxCount: 5 }
    ]))
    async update(
        @Param('id') id: string,
        @Body() updateMessageDto: UpdateMessageDto,
        @UploadedFiles() files: {
            media?: Express.Multer.File[],
            voices?: Express.Multer.File[],
            videos?: Express.Multer.File[]
        },
        @RequestParams() params: RequestParams,
    ) {
        return await this.messageService.update(id, {
            updateMessageDto,
            media: files?.media,
            voices: files?.voices,
            videos: files?.videos
        }, params.user_info_id)
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить сообщение' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно удалено' })
    async remove(
      @Param('id') id: string,
      @RequestParams() params: RequestParams,
      ) {
        return await this.messageService.remove(id, params)
    }

    @Post(':id/mark-delivered')
    @ApiOperation({ summary: 'Отметить сообщение как доставленное' })
    @ApiResponse({ status: 200, description: 'Сообщение отмечено как доставленное', type: MessageEntity })
    async markAsDelivered(@Param('id') id: string) {
        return await this.messageService.markAsDelivered(id)
    }

    @Post(':id/mark-read')
    @ApiOperation({ summary: 'Отметить сообщение как прочитанное' })
    @ApiResponse({ status: 200, description: 'Сообщение отмечено как прочитанное', type: MessageEntity })
    async markAsRead(@Param('id') id: string) {
        return await this.messageService.markAsRead(id)
    }

    @Post(':id/forward')
    @ApiOperation({ summary: 'Переслать сообщение' })
    @ApiResponse({ status: 200, description: 'Сообщение успешно переслано', type: MessageEntity })
    async forwardMessage(
        @Param('id') id: string,
        @Body('text') text: string,
        @RequestParams() params: RequestParams,
    ) {
        return await this.messageService.createForwardedMessage(id, params, text)
    }

    @Post(':id/reply')
    @ApiOperation({ summary: 'Ответить на сообщение' })
    @ApiResponse({ status: 200, description: 'Ответ на сообщение успешно создан', type: MessageEntity })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'media', maxCount: 20 },
        { name: 'voices', maxCount: 5 },
        { name: 'videos', maxCount: 5 }
    ]))
    async replyToMessage(
        @Param('id') id: string,
        @Body() createMessageDto: CreateMessageDto,
        @UploadedFiles() files: {
            media?: Express.Multer.File[],
            voices?: Express.Multer.File[],
            videos?: Express.Multer.File[]
        },
        @RequestParams() params: RequestParams,
    ) {
        return await this.messageService.createReply(id, {
            createMessageDto,
            media: files?.media,
            voices: files?.voices,
            videos: files?.videos
        }, params)
    }

    @Get(':id/media')
    @ApiOperation({ summary: 'Получить все медиафайлы сообщения' })
    @ApiResponse({ status: 200, description: 'Медиафайлы сообщения успешно получены' })
    async getAllMediaForMessage(@Param('id') id: string) {
        return await this.messageService.getAllMediaForMessage(id)
    }

    @Get(':id/reply-chain')
    @ApiOperation({ summary: 'Получить цепочку ответов на сообщение' })
    @ApiResponse({ status: 200, description: 'Цепочка ответов успешно получена', type: [MessageEntity] })
    async getReplyChain(@Param('id') id: string) {
        return await this.messageService.getReplyChain(id)
    }

    @Get('search')
    @ApiOperation({ summary: 'Полнотекстовый поиск по сообщениям' })
    @ApiResponse({ status: 200, description: 'Результаты поиска успешно получены', type: [MessageEntity] })
    async fullTextSearch(
        @Query('searchTerm') searchTerm: string,
        @RequestParams() params: RequestParams,
    ) {
        return await this.messageService.fullTextSearch(searchTerm, params)
    }


    @Post('temporary')
    @ApiOperation({ summary: 'Создать временное сообщение' })
    @ApiResponse({ status: 200, description: 'Временное сообщение успешно создано', type: MessageEntity })
    async createTemporaryMessage(
        @Body() createMessageDto: CreateMessageDto,
        @Body('expirationTime') expirationTime: number,
        @RequestParams() params: RequestParams,
    ) {
        return await this.messageService.createTemporaryMessage(createMessageDto, expirationTime, params)
    }
}

import { ConfigEnum } from '@config/config.enum'
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Param,
    ParseFilePipe,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MediaResponseDto } from '@services/media/info/dto/media-response.dto'
import { UpdateMediaDto } from '@services/media/info/dto/update-media.dto'
import { MediaEntity, MediaEntitySourceType } from '@services/media/info/entities/media.entity'
import { Request, Response } from 'express'
import { RequestParams } from 'src/shared/decorators'
import { createPaginationHeaders } from 'src/shared/utils'
import { AudioValidator, DocumentValidator, ImageValidator, VideoValidator } from './decorators'
import { GetMediaDto } from './dto/get-media.dto'
import { MediaInfoService } from './media-info.service'

@ApiTags('Медиа')
@Controller('api/media/info')
export class MediaInfoController {
    private readonly maxStorage: number

    constructor(
        private readonly mediaInfoService: MediaInfoService,
        private readonly configService: ConfigService
    ) {
        // Доступно места для загрузки
        this.maxStorage = this.configService.get(`${ConfigEnum.MAIN}.maxUserStorage`)
    }

    @Post('upload')
    @ApiOperation({ summary: 'Загрузить файлы' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'any',
                        format: 'binary',
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Файлы успешно загружены', type: [MediaEntity] })
    @UseInterceptors(FilesInterceptor('files'))
    async uploadFiles(
        @UploadedFiles(
            new ParseFilePipe({
                validators: [
                    new ImageValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
                    new VideoValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
                    new AudioValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
                    new DocumentValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
                ],
            }),
        )
            files: Express.Multer.File[],
        @RequestParams() params: RequestParams,
        @Req() req: Request
    ) {
        // Проверяем квоту
        await this.mediaInfoService.checkStorageLimit(params.user_info_id, files, this.maxStorage)

        // Если есть доступное место - возвращаем загруженный файл
        return this.mediaInfoService.uploadFiles(files, params.user_info_id, MediaEntitySourceType.USER_UPLOADED_MEDIA)
    }

    @Get(':id')
    @ApiOperation({ summary: 'Скачать файл' })
    @ApiParam({ name: 'id', description: 'ID файла' })
    @ApiResponse({ status: 200, description: 'Файл успешно скачан' })
    @ApiResponse({ status: 404, description: 'Файл не найден' })
    async downLoadFile(
        @Param('id') id: string,
        @Res() res: Response
    ) {
        try {
            const { file, metadata } = await this.mediaInfoService.downLoadFile(id)
            res.set({
                'Content-Type': metadata.mimeType,
                'Content-Disposition': `inline; filename="${encodeURIComponent(metadata.name)}"`,
            })
            res.send(file)
        } catch (error) {
            if (error instanceof NotFoundException) {
                res.status(404).send('Файл не найден')
            } else if (error instanceof BadRequestException) {
                res.status(400).send(error.message)
            } else {
                res.status(500).send('Внутренняя ошибка сервера')
            }
        }
    }

    @Get()
    @ApiOperation({ summary: 'Получить список файлов' })
    @ApiQuery({ type: GetMediaDto })
    @ApiResponse({ status: 200, description: 'Список файлов', type: [MediaResponseDto] })
    async getFiles(
        @Query() query: GetMediaDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const { data, paginationInfo } = await this.mediaInfoService.getFilesWithReactions(query, params)

        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Patch('update')
    @ApiOperation({ summary: 'Обновить инф о файлах' })
    @ApiResponse({ status: 200, description: 'Файлы успешно обновлены' })
    async updateMedia(
      @Body() updateMediaDto: UpdateMediaDto,
      @RequestParams() params: RequestParams
    ) {
        return await this.mediaInfoService.updateMedias(updateMediaDto, params)
    }

    @Delete('delete/:id')
    @ApiOperation({ summary: 'Удалить файл' })
    @ApiParam({ name: 'id', description: 'ID медиа', type: String })
    @ApiResponse({ status: 200, description: 'Файл успешно удален' })
    @ApiResponse({ status: 404, description: 'Файл не найден' })
    async deleteFile(
      @Param('id') id: string,
      @RequestParams() params: RequestParams
      ) {
        try {
            return await this.mediaInfoService.deleteFile(id, params)
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException('Файл не найден')
            }
            throw new InternalServerErrorException('MediaInfoController: Не удалось удалить файл', error)
        }
    }
}

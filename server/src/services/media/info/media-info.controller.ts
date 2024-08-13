import {
    BadRequestException,
    Controller,
    Delete,
    Get, InternalServerErrorException, NotFoundException,
    Param,
    ParseFilePipe,
    Post, Query,
    Req,
    Res,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import { MediaInfoService } from "./media-info.service";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { AudioValidator, DocumentValidator, ImageValidator, VideoValidator } from "./decorators";
import { ConfigService } from "@nestjs/config";
import { ConfigEnum } from "@config/config.enum";
import { GetMediaDto } from "@src/services/media/info/dto/get-media.dto";
import { RequestParams } from "@src/decorators";

@Controller('api/media/info')
export class MediaInfoController {
    private readonly maxStorage: number;

    constructor(
        private readonly mediaInfoService: MediaInfoService,
        private readonly configService: ConfigService
    ) {
        // Доступно места для загрузки
        this.maxStorage = this.configService.get(`${ConfigEnum.MAIN}.maxUserStorage`);
    }

    @Post('upload/:userId')
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
        @Param('userId') userId: string,
        @Req() req: Request
    ) {
        // Проверяем квоту
        await this.mediaInfoService.checkStorageLimit(userId, files, this.maxStorage)

        // Если есть доступное место - возвращаем загруженный файл
        return this.mediaInfoService.uploadFiles(files, userId);
    }

    @Get(':id')
    async getFile(
        @Param('id') id: string,
        @Res() res: Response
    ) {
        try {
            const { file, metadata } = await this.mediaInfoService.getFile(id);
            res.set({
                'Content-Type': metadata.mimeType,
                'Content-Disposition': `inline; filename="${encodeURIComponent(metadata.name)}"`,
            });
            res.send(file);
        } catch (error) {
            if (error instanceof NotFoundException) {
                res.status(404).send('Файл не найден');
            } else if (error instanceof BadRequestException) {
                res.status(400).send(error.message);
            } else {
                res.status(500).send('Внутренняя ошибка сервера');
            }
        }
    }

    @Get()
    async getFiles(
        @Query() query: GetMediaDto,
        @RequestParams() params: RequestParams,
    ) {
        const d = await this.mediaInfoService.getFiles(query, params);

        return d
    }

    @Delete(':id')
    async deleteFile(@Param('id') id: string) {
        try {
            return await this.mediaInfoService.deleteFile(id);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException('Файл не найден');
            }
            throw new InternalServerErrorException('Не удалось удалить файл');
        }
    }
}

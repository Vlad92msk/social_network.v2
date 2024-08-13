import {
    Controller,
    Delete,
    Get,
    Param,
    ParseFilePipe,
    Post,
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
        const { file, metadata } = await this.mediaInfoService.getFile(id);
        res.set({
            'Content-Type': metadata.mimeType,
            'Content-Disposition': `inline; filename="${metadata.name}"`,
        });
        res.send(file);
    }

    @Delete(':id')
    async deleteFile(
        @Param('id') id: string
    ) {
        return this.mediaInfoService.deleteFile(id);
    }

    @Get('metadata/:id')
    async getMetadata(
        @Param('id') id: string
    ) {
        return this.mediaInfoService.getMetadata(id);
    }
}

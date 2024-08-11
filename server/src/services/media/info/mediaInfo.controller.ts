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
import { MediaInfoService } from "./mediaInfo.service";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { AudioValidator, DocumentValidator, ImageValidator, VideoValidator } from "@src/services/media/info/decorators";

@Controller('api/media/info')
export class MediaInfoController {
    constructor(private readonly mediaInfoService: MediaInfoService) {}

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

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MetadataService } from "../metadata/media-metadata.service";
import { AbstractStorageService } from "../storage/abstract-storage.service";
import { MediaItemType } from "../metadata/interfaces/mediaItemType";
import * as path from 'path';
import { GetMediaDto } from "./dto/get-media.dto";
import { RequestParams } from "src/shared/decorators";
import { createPaginationResponse } from "src/shared/utils";

@Injectable()
export class MediaInfoService {

    constructor(
        private readonly storageService: AbstractStorageService,
        private readonly metadataService: MetadataService,
    ) {}

    /**
     * Загружает файлы
     */
    async uploadFiles(files: Express.Multer.File[], userId: string) {
        const uploadedFiles = [];

        for (const file of files) {
            const fileType = this.storageService.getFileType(file.mimetype);
            let fileName = `${Date.now()}-${file.originalname}`;

            const filePath = await this.storageService.uploadFile(file.buffer, fileName, userId, fileType);
            const fileUrl = this.storageService.getFileUrl(filePath);

            // Если это изображение, обновляем расширение файла и MIME-тип
            if (fileType === MediaItemType.IMAGE) {
                fileName = path.basename(filePath); // Получаем имя файла из пути, включая .webp расширение
                file.mimetype = 'image/webp';
            }

            const metadata = await this.metadataService.create({
                name: fileName,
                src: fileUrl,
                mimeType: file.mimetype,
                size: file.size,
                lastModified: new Date(),
                type: fileType,
                user_id: userId,
            });

            uploadedFiles.push({ metadata, filePath: fileUrl });
        }

        return uploadedFiles;
    }

    /**
     * Получить Blob файла по Id
     */
    async downLoadFile(id: string) {
        // Получаем метаданные
        const metadata = await this.metadataService.findOne(id);
        if (!metadata) throw new NotFoundException('Файл не найден');

        try {
            // Получаем реальную ссылку для скачивания
            const urlParts = new URL(metadata.src);
            const relativePath = decodeURIComponent(urlParts.pathname.replace('/uploads/', ''));

            const file = await this.storageService.getFile(relativePath);
            return { file, metadata };
        } catch (error) {
            throw new BadRequestException('Не удалось получить файл');
        }
    }

    /**
     * Получить ссылки на файлы
     */
    async getFiles(query: GetMediaDto, requestParams?: RequestParams) {

        // Получаем метаданные файлов
        const { data: foundFiles, total } = await this.metadataService.findAll({
                file_ids: query.file_ids,
                per_page: query.per_page,
                page: query.page,
            });

        // Получаем статические ссылки
        const filesWithContent = foundFiles.map((metadata) => {
            const urlParts = new URL(metadata.src);
            const relativePath = decodeURIComponent(urlParts.pathname.replace('/uploads/', ''));
            return {
                metadata,
                url: this.storageService.getFileUrl(relativePath)
            };
        });

        // Отдаем ответ с пагинацией
        return createPaginationResponse({
            data: filesWithContent,
            total,
            page: query?.page,
            per_page: query?.per_page,
        })
    }

    async deleteFile(id: string) {
        const metadata = await this.metadataService.findOne(id);
        if (!metadata) {
            throw new NotFoundException('Файл не найден');
        }

        try {
            const urlParts = new URL(metadata.src);
            const relativePath = decodeURIComponent(urlParts.pathname.replace('/uploads/', ''));

            await this.storageService.deleteFile(relativePath);
            await this.metadataService.remove(id);
            return { message: 'Файл успешно удален' };
        } catch (error) {
            throw new BadRequestException('Не удалось удалить файл');
        }
    }

    /**
     * Проверяет сколько места доступно для загрузки файлов для конкретного пользователя
     */
    async checkStorageLimit(userId: string, files: Express.Multer.File[], maxStorage: number): Promise<void> {
        const currentUsage = await this.metadataService.getUserStorageUsage(userId);
        const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);

        const totalAfterUpload = currentUsage + totalUploadSize;

        if (totalAfterUpload > maxStorage) {
            throw new BadRequestException(`Превышен лимит хранения файлов. Максимальный размер хранилища: ${maxStorage} байт.`);
        } else {
            console.log(`Storage check passed. Remaining space after upload: ${maxStorage - totalAfterUpload} bytes`);
        }
    }

}

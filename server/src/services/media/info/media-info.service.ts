import { BadRequestException, Injectable } from '@nestjs/common';
import { MetadataService } from "../metadata/media-metadata.service";
import { AbstractStorageService } from "../storage/abstract-storage.service";
import { MediaItemType } from "../metadata/interfaces/mediaItemType";
import * as path from 'path';

@Injectable()
export class MediaInfoService {

    constructor(
        private readonly storageService: AbstractStorageService,
        private readonly metadataService: MetadataService,
    ) {}

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

    async getFile(id: string) {
        const metadata = await this.metadataService.findOne(id);
        const file = await this.storageService.getFile(metadata.src);
        return { file, metadata };
    }

    async deleteFile(id: string) {
        const metadata = await this.metadataService.findOne(id);
        await this.storageService.deleteFile(metadata.src);
        await this.metadataService.remove(id);
        return { message: 'File deleted successfully' };
    }

    async getMetadata(id: string) {
        return this.metadataService.findOne(id);
    }
}

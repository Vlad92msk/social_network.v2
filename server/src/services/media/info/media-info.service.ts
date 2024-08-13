import { BadRequestException, Injectable } from '@nestjs/common';
import { MetadataService } from "../metadata/media-metadata.service";
import { AbstractStorageService } from "../storage/abstract-storage.service";

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
            const remainingSpace = maxStorage - currentUsage;
            console.log(`Throwing error. Remaining space: ${remainingSpace} bytes`);
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
            // Получаем тип файла
            const fileType = this.storageService.getFileType(file.mimetype);
            const fileName = `${Date.now()}-${file.originalname}`;
            // Сохраняем файл в хранилище и получаем путь к сохраненному файлу в системе
            const filePath = await this.storageService.uploadFile(file.buffer, fileName, userId, fileType);

            // Сохранияем метаданные файла в базе
            const metadata = await this.metadataService.create({
                name: fileName,
                src: filePath,
                mimeType: file.mimetype,
                size: file.size,
                lastModified: new Date(),
                type: fileType,
                user_id: userId,
            });

            uploadedFiles.push({ metadata, filePath });
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

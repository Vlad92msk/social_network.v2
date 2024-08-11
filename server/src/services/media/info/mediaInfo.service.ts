import { Injectable } from '@nestjs/common';
import { MediaStorageService } from "../storage/mediaStorage.service";
import { MetadataService } from "../metadata/mediaMetadata.service";

@Injectable()
export class MediaInfoService {
    constructor(
        private readonly storageService: MediaStorageService,
        private readonly metadataService: MetadataService,
    ) {}

    async uploadFiles(files: Express.Multer.File[], userId: string) {
        const uploadedFiles = [];

        for (const file of files) {
            const filePath = await this.storageService.uploadFile(file, userId);
            const metadata = await this.metadataService.create({
                name: file.originalname,
                src: filePath,
                mimeType: file.mimetype,
                size: file.size,
                lastModified: new Date(),
                type: this.storageService.getFileType(file.mimetype),
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

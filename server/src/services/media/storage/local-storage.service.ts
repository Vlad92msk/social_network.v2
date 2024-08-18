import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as mime from 'mime-types';
import { MediaItemType } from "../metadata/interfaces/mediaItemType";
import { ConfigService } from "@nestjs/config";
import { ConfigEnum } from "@config/config.enum";
import { AbstractStorageService } from "./abstract-storage.service";

@Injectable()
export class LocalStorageService extends AbstractStorageService {
    private readonly uploadDir: string;
    private readonly host: string;
    private readonly port: string;

    constructor(private readonly configService: ConfigService) {
        super()
        this.uploadDir = this.configService.get(`${ConfigEnum.MAIN}.uploadDir`);
        this.host = this.configService.get(`${ConfigEnum.MAIN}.host`);
        this.port = this.configService.get(`${ConfigEnum.MAIN}.port`);
    }

    async uploadFile(file: Buffer, fileName: string, userId: number, fileType: MediaItemType) {
        const filePath = path.join(this.uploadDir, fileType, `user_id_${userId}`);
        const fullFilePath = path.join(filePath, fileName);

        await fs.mkdir(filePath, { recursive: true });

        if (fileType === MediaItemType.IMAGE) {
            await this.saveAsWebP(file, fullFilePath);
            // Обновляем fileName, чтобы он отражал .webp расширение
            fileName = fileName.replace(/\.[^/.]+$/, ".webp");
        } else {
            await fs.writeFile(fullFilePath, file);
        }

        // Возвращаем относительный путь к файлу
        return path.join(fileType, `user_id_${userId}`, fileName);
    }

    async getFile(filePath: string): Promise<Buffer> {
        const fullPath = path.join(this.uploadDir, filePath);
        try {
            return await fs.readFile(fullPath);
        } catch (error) {
            throw new Error('Не удалось прочитать файл');
        }
    }

    getFileUrl(filePath: string): string {
        return `http://${this.host}:${this.port}/uploads/${filePath}`;
    }

    async deleteFile(filePath: string): Promise<void> {
        const fullPath = path.join(this.uploadDir, filePath);
        try {
            await fs.unlink(fullPath);
        } catch (error) {
            throw new Error('Не удалось удалить файл');
        }
    }

    getFileType(mimeType: string): MediaItemType {
        const type = mime.extension(mimeType) as string;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return MediaItemType.IMAGE;
        if (['mp4', 'webm'].includes(type)) return MediaItemType.VIDEO;
        if (['mp3', 'wav'].includes(type)) return MediaItemType.AUDIO;
        return MediaItemType.OTHER;
    }

    private async saveAsWebP(buffer: Buffer, filePath: string): Promise<string> {
        const webpPath = filePath.replace(/\.[^/.]+$/, ".webp");
        try {
            await sharp(buffer)
                .webp({ quality: 80 })
                .toFile(webpPath);
            return webpPath;
        } catch (error) {
            throw error;
        }
    }
}

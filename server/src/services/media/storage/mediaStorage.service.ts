import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as mime from 'mime-types';
import * as clamav from 'clamav.js';
import { MetadataService } from "../metadata/mediaMetadata.service";
import { Readable } from 'stream';
import { MediaItemType } from "../metadata/interfaces/mediaItemType";
import { ConfigService } from "@nestjs/config";
import { ConfigEnum } from "@config/config.enum";

@Injectable()
export class MediaStorageService {
    private readonly clamavPort = 3310;
    private readonly clamavHost = '127.0.0.1';

    private readonly uploadDir: string;

    constructor(
        private readonly metadataService: MetadataService,
        private readonly configService: ConfigService
    ) {
        this.uploadDir = this.configService.get(`${ConfigEnum.MAIN}.uploadDir`)
        // Путь к директории uploads относительно корня проекта
        console.log('Upload directory:', this.uploadDir);
    }

    async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
        console.log('Uploading file:', file);

        const fileType = this.getFileType(file.mimetype);
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(this.uploadDir, fileType, `user_id_${userId}`);
        const fullFilePath = path.join(filePath, fileName);


        await fs.mkdir(filePath, { recursive: true });

        if (fileType === MediaItemType.IMAGE) {
            await this.saveAsWebP(file.buffer, fullFilePath);
        } else {
            await fs.writeFile(fullFilePath, file.buffer);
        }


        const relativePath = path.relative(this.uploadDir, fullFilePath);

        await this.metadataService.create({
            name: fileName,
            src: relativePath,
            mimeType: file.mimetype,
            size: file.size,
            lastModified: new Date(),
            type: fileType,
            user_id: userId,
        });

        return relativePath;
    }

    private async scanFile(file: Express.Multer.File): Promise<void> {
        console.log('Skipping virus scan for now');
        return Promise.resolve();
    }

    private async scanFile1(file: Express.Multer.File): Promise<void> {
        if (!file.buffer) {
            throw new BadRequestException('File buffer is missing');
        }

        return new Promise((resolve, reject) => {
            const scanner = clamav.createScanner(this.clamavPort, this.clamavHost);
            const readableStream = Readable.from(file.buffer);

            scanner.scan(readableStream, (err, object, malicious) => {
                if (err) {
                    reject(new BadRequestException(`Virus scan failed: ${err}`));
                } else if (malicious) {
                    reject(new BadRequestException(`File is infected with ${malicious}`));
                } else {
                    resolve();
                }
            });
        });
    }

    public getFileType(mimeType: string): MediaItemType {
        const type = mime.extension(mimeType) as string
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return MediaItemType.IMAGE;
        if (['mp4', 'webm'].includes(type)) return MediaItemType.VIDEO;
        if (['mp3', 'wav'].includes(type)) return MediaItemType.AUDIO;
        return MediaItemType.OTHER;
    }

    private async saveAsWebP(buffer: Buffer, filePath: string): Promise<void> {
        const webpPath = filePath.replace(/\.[^/.]+$/, ".webp");
        console.log('Saving WebP to:', webpPath);
        try {
            await sharp(buffer)
                .webp({ quality: 80 })
                .toFile(webpPath);
            console.log('WebP file saved successfully');
        } catch (error) {
            console.error('Error saving WebP file:', error);
            throw error;
        }
    }

    async getFile(filePath: string): Promise<Buffer> {
        return await fs.readFile(filePath);
    }

    async deleteFile(filePath: string): Promise<void> {
        await fs.unlink(filePath);
    }
}

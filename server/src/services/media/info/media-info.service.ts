import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MetadataService } from "../metadata/media-metadata.service";
import { AbstractStorageService } from "../storage/abstract-storage.service";
import { MediaItemType } from "../metadata/interfaces/mediaItemType";
import * as path from 'path';
import { GetMediaDto } from "./dto/get-media.dto";
import { RequestParams } from "src/shared/decorators";
import { createPaginationQueryOptions, createPaginationResponse } from "src/shared/utils";
import { MediaEntity } from "@services/media/info/entities/media.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserInfoService } from "@services/users/user-info/user-info.service";
import { TagsService } from "@services/tags/tags.service";

@Injectable()
export class MediaInfoService {

    constructor(
        private readonly storageService: AbstractStorageService,
        private readonly metadataService: MetadataService,
        @Inject(forwardRef(() => UserInfoService))
        private readonly userService: UserInfoService,
        @InjectRepository(MediaEntity)
        private mediaInfoRepository: Repository<MediaEntity>,

        @Inject(forwardRef(() => TagsService))
        private readonly tagsService: TagsService,
    ) {}

    /**
     * Загружает файлы
     */
    async uploadFiles(files: Express.Multer.File[], userId: string) {
        const uploadedFiles: MediaEntity[] = [];

        const user = await this.userService.getUsersById(userId)

        for (const file of files) {
            const fileType = this.storageService.getFileType(file.mimetype);
            let fileName = `${Date.now()}-${file.originalname}`.replace(' ', '_').toLowerCase().trim();

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
            });

            const media = this.mediaInfoRepository.create({
                meta: metadata,
                owner: user,
            });

            const savedMedia = await this.mediaInfoRepository.save(media);
            uploadedFiles.push(savedMedia);
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
     * Получить статическую ссылку на файл
     */
    // async getFileStaticURL(id: string, requestParams?: RequestParams) {
    //     const findMetadata = await this.metadataService.findOne(id);
    //
    //     // Получаем статические ссылки
    //     const urlParts = new URL(findMetadata.src);
    //     const relativePath = decodeURIComponent(urlParts.pathname.replace('/uploads/', ''));
    //     return this.storageService.getFileUrl(relativePath)
    // }

    /**
     * Получить ссылки на файлы
     */
    async getFiles(query: GetMediaDto, requestParams?: RequestParams) {
        const { data: foundFiles, total } = await this.metadataService.findAll(createPaginationQueryOptions({ query }));

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
        return createPaginationResponse({ data: filesWithContent, total, query })
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
        const currentUsage = await this.metadataService.getUserStorageUsage(userId)
        const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0)

        const totalAfterUpload = currentUsage + totalUploadSize

        if (totalAfterUpload > maxStorage) {
            throw new BadRequestException(`Превышен лимит хранения файлов. Максимальный размер хранилища: ${maxStorage} байт.`);
        } else {
            console.log(`Storage check passed. Remaining space after upload: ${maxStorage - totalAfterUpload} bytes`);
        }
    }


    //_____________________
    // РАБОТА С ТЕГАМИ


    /**
     * Добавляет теги к медиафайлу
     */
    async addTagsToMedia(mediaId: string, tagIds: string[]) {
        const media = await this.mediaInfoRepository.findOne({
            where: { id: mediaId },
            relations: ['tags']
        });

        if (!media) {
            throw new NotFoundException(`Медиа с ID "${mediaId}" не найден`)
        }

        const tags = await this.tagsService.findTagsByIds(tagIds)

        if (tags.length !== tagIds.length) {
            throw new BadRequestException('One or more tags not found')
        }

        media.tags = [...media.tags, ...tags];
        return this.mediaInfoRepository.save(media)
    }

    /**
     * Удаляет теги с медиафайла
     */
    async removeTagsFromMedia(mediaId: string, tagIds: string[]) {
        const media = await this.mediaInfoRepository.findOne({
            where: { id: mediaId },
            relations: ['tags']
        });

        if (!media) {
            throw new NotFoundException(`Медиа с ID "${mediaId}" не найден`)
        }

        media.tags = media.tags.filter(tag => !tagIds.includes(tag.id))
        return this.mediaInfoRepository.save(media)
    }

    /**
     * Получает все теги для медиафайла
     */
    async getMediaTags(mediaId: string) {
        const media = await this.mediaInfoRepository.findOne({
            where: { id: mediaId },
            relations: ['tags'],
        });

        if (!media) {
            throw new NotFoundException(`Медиа с ID "${mediaId}" не найден`)
        }

        return media.tags
    }
}

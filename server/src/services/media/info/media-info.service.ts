import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { MetadataService } from '../metadata/media-metadata.service'
import { AbstractStorageService } from '../storage/abstract-storage.service'
import { MediaItemType } from '../metadata/interfaces/mediaItemType'
import * as path from 'path'
import * as crypto from 'crypto'
import { GetMediaDto } from './dto/get-media.dto'
import { RequestParams } from 'src/shared/decorators'
import { createPaginationQueryOptions, createPaginationResponse, validUuids } from 'src/shared/utils'
import { MediaEntity } from './entities/media.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { UserInfoService } from '@services/users/user-info/user-info.service'

@Injectable()
export class MediaInfoService {

    constructor(
        private readonly storageService: AbstractStorageService,
        private readonly metadataService: MetadataService,

        @Inject(forwardRef(() => UserInfoService))
        private readonly userService: UserInfoService,

        @InjectRepository(MediaEntity)
        private mediaInfoRepository: Repository<MediaEntity>,
    ) {}

    /**
     * Загружает файлы
     */
    async uploadFiles(files: Express.Multer.File[], userId: number) {
        const uploadedFiles: MediaEntity[] = []

        const user = await this.userService.getUsersById(userId)


        for (const file of files) {
            let originalName = file.originalname

            // Регулярное выражение для проверки на допустимые символы (латинские буквы, цифры, дефис, подчеркивание)
            const isValidName = /^[a-zA-Z0-9-_]+$/.test(originalName)

            if (!isValidName) {
                // Если имя файла содержит недопустимые символы, генерируем рандомное имя
                const randomName = crypto.randomBytes(8).toString('hex')
                const fileExtension = originalName.split('.').pop() // Получаем расширение файла
                originalName = `${randomName}.${fileExtension}`
            }

            const fileType = this.storageService.getFileType(file.mimetype)
            let fileName = `${Date.now()}-${originalName}`.replace(' ', '_').toLowerCase().trim()

            const filePath = await this.storageService.uploadFile(file.buffer, fileName, userId, fileType)
            const fileUrl = this.storageService.getFileUrl(filePath)

            // Если это изображение, обновляем расширение файла и MIME-тип
            if (fileType === MediaItemType.IMAGE) {
                fileName = path.basename(filePath) // Получаем имя файла из пути, включая .webp расширение
                file.mimetype = 'image/webp'
            }

            const metadata = await this.metadataService.create({
                name: fileName,
                src: fileUrl,
                mimeType: file.mimetype,
                size: file.size,
                lastModified: new Date(),
                type: fileType,
                user_id: userId,
            })

            const media = this.mediaInfoRepository.create({
                meta: metadata,
                owner: user,
            })

            const savedMedia = await this.mediaInfoRepository.save(media)
            uploadedFiles.push(savedMedia)
        }

        return uploadedFiles
    }

    /**
     * Получить Blob файла по Id
     */
    async downLoadFile(id: string) {
        // Получаем метаданные
        const metadata = await this.metadataService.findOne(id)
        if (!metadata) throw new NotFoundException('Файл не найден')

        try {
            // Получаем реальную ссылку для скачивания
            const urlParts = new URL(metadata.src)
            const relativePath = decodeURIComponent(urlParts.pathname.replace('/uploads/', ''))

            const file = await this.storageService.getFile(relativePath)
            return { file, metadata }
        } catch (error) {
            throw new BadRequestException('Не удалось получить файл')
        }
    }

    /**
     * Получить 1 файл
     */
    async getFileById(id: string, requestParams?: RequestParams) {
        return await this.mediaInfoRepository.findOne({
            where: { id },
            relations: ['meta', 'owner', 'tags']
        })
    }

    /**
     * Получить ссылки на файлы
     */
    async getFiles(query: GetMediaDto, requestParams?: RequestParams) {
        const { file_ids, ...restQuery } = query

        const ids = validUuids(file_ids)

        const [data, total] = await this.mediaInfoRepository.findAndCount(
            createPaginationQueryOptions<MediaEntity>({
                query: {...restQuery, id: ids && In(ids) },
                options: { relations: ['meta', 'owner', 'tags'] }
            })
        )

        // Отдаем ответ с пагинацией
        return createPaginationResponse({ data, total, query })
    }

    async deleteFile(id: string) {
        const metadata = await this.metadataService.findOne(id)
        if (!metadata) {
            throw new NotFoundException('Файл не найден')
        }

        try {
            const urlParts = new URL(metadata.src)
            const relativePath = decodeURIComponent(urlParts.pathname.replace('/uploads/', ''))

            await this.storageService.deleteFile(relativePath)
            await this.metadataService.remove(id)
            return { message: 'Файл успешно удален' }
        } catch (error) {
            throw new BadRequestException('Не удалось удалить файл')
        }
    }

    /**
     * Проверяет сколько места доступно для загрузки файлов для конкретного пользователя
     */
    async checkStorageLimit(userId: number, files: Express.Multer.File[], maxStorage: number): Promise<void> {
        const currentUsage = await this.metadataService.getUserStorageUsage(userId)
        const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0)

        const totalAfterUpload = currentUsage + totalUploadSize

        if (totalAfterUpload > maxStorage) {
            throw new BadRequestException(`Превышен лимит хранения файлов. Максимальный размер хранилища: ${maxStorage} байт.`)
        } else {
            console.log(`Storage check passed. Remaining space after upload: ${maxStorage - totalAfterUpload} bytes`)
        }
    }
}

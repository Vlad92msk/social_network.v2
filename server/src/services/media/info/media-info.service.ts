import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { MediaResponseDto } from '@services/media/info/dto/media-response.dto'
import { UpdateMediaDto } from '@services/media/info/dto/update-media.dto'
import { CalculateReactionsResponse } from '@services/reactions/dto/toggle-reaction-response.dto'
import { MetadataService } from '../metadata/media-metadata.service'
import { AbstractStorageService } from '../storage/abstract-storage.service'
import { MediaItemType } from '../metadata/interfaces/mediaItemType'
import * as path from 'path'
import * as crypto from 'crypto'
import { GetMediaDto } from './dto/get-media.dto'
import { RequestParams } from 'src/shared/decorators'
import { addMultipleRangeFilters, createPaginationQueryOptions, createPaginationResponse, validUuids } from 'src/shared/utils'
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
    async uploadFiles(files: Express.Multer.File[], userId: number, fileType?: MediaItemType) {
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

            const receivedFileType = this.storageService.getFileType(file.mimetype)
            let fileName = `${Date.now()}-${originalName}`.replace(' ', '_').toLowerCase().trim()

            const filePath = await this.storageService.uploadFile(file.buffer, fileName, userId, fileType ? fileType : receivedFileType)
            const fileUrl = this.storageService.getFileUrl(filePath)

            // Если это изображение, обновляем расширение файла и MIME-тип
            if (receivedFileType === MediaItemType.IMAGE) {
                fileName = path.basename(filePath) // Получаем имя файла из пути, включая .webp расширение
                file.mimetype = 'image/webp'
            }

            const metadata = await this.metadataService.create({
                name: fileName,
                src: fileUrl,
                mimeType: file.mimetype,
                size: file.size,
                lastModified: new Date(),
                type: receivedFileType,
                user_id: userId,
            })

            const media = this.mediaInfoRepository.create({
                meta: metadata,
                owner: user,
            })

            const savedMedia = await this.mediaInfoRepository.save(media)

            // Загружаем метаданные вместе с медиа
            const savedMediaWithMeta = await this.mediaInfoRepository.findOne({
                where: { id: savedMedia.id },
                relations: ['meta'],
            })

            uploadedFiles.push(savedMediaWithMeta)
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
            relations: ['meta', 'owner', 'tags', 'reactions', 'reactions.reaction']
        })
    }

    private calculateReactions(comment, params): CalculateReactionsResponse {
        const reactionCounts = comment.reactions.reduce((acc, reaction) => {
            const reactionName = reaction.reaction.name
            acc[reactionName] = (acc[reactionName] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const userReaction = comment.reactions.find(reaction => reaction.user.id === params.user_info_id)

        const reactionInfo: CalculateReactionsResponse = {
            counts: reactionCounts,
            my_reaction: userReaction ? userReaction.reaction.name : null
        }

        delete comment.reactions

        return reactionInfo
    }

    /**
     * Получить ссылки на файлы
     */
    async getFiles(query: GetMediaDto, requestParams?: RequestParams) {
        const {
            file_ids,
            type,
            owner_id,
          created_at_from, created_at_to,
          updated_at_from, updated_at_to,
          comments_count_from, comments_count_to,
          views_count_from, views_count_to
          ,
          ...restQuery } = query

        const owner = await this.userService.getUsersByParams({ public_id: requestParams.user_public_id }, requestParams)
        const ids = validUuids(file_ids)
        const queryOptions = createPaginationQueryOptions<MediaEntity>({
            query: {...restQuery, id: ids?.length && In(ids) },
            options: {
                where: {
                    owner: owner_id ? { id: owner_id } : { id: owner.id },
                    meta: type ? { type } : undefined,
                },
                relations: [
                    'reactions',
                    'reactions.reaction',
                    'reactions.user',
                ]
            }
        })


        // Фильтры по диапазонам
        addMultipleRangeFilters<MediaEntity>(queryOptions.where, {
            comments_count: { min: comments_count_from, max: comments_count_to },
            created_at: { min: created_at_from, max: created_at_to },
            updated_at: { min: updated_at_from, max: updated_at_to },
            views_count: { min: views_count_from, max: views_count_to }
        })

        const test = {
            ...queryOptions,
            where: {
                ...queryOptions.where,
                id: ids?.length && In(ids)
            },
        }

        const [data, total] = await this.mediaInfoRepository.findAndCount(test)

        // Отдаем ответ с пагинацией
        return createPaginationResponse({ data, total, query })
    }

    async getFilesWithReactions(query: GetMediaDto, requestParams?: RequestParams) {
        const { data, paginationInfo:{total} } = await this.getFiles(query, requestParams)

        const responseData = data.map(comment => {
            return ({
                ...comment,
                reaction_info: this.calculateReactions(comment, requestParams),
            })
        })

        // Отдаем ответ с пагинацией
        return createPaginationResponse<MediaResponseDto[]>({ data: responseData, total, query })
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

    async updateMedias(query: UpdateMediaDto, requestParams?: RequestParams) {
        const { data: currentFiles } = await this.getFiles({ file_ids: query.target_ids, owner_id: requestParams.user_info_id }, requestParams)

        console.log('currentFiles', currentFiles)
        console.log('query', query)
        for (const media of currentFiles) {
            if (query?.album_name !== undefined) {
                media.album_name = query.album_name
            }
            await this.mediaInfoRepository.save(media)
        }
    }

    /**
     * Проверяет сколько места доступно для загрузки файлов для конкретного пользователя
     */
    async checkStorageLimit(userId: number, files: Express.Multer.File[], maxStorage: number) {
        const currentUsage = await this.metadataService.getUserStorageUsage(userId)
        const totalUploadSize = files?.filter(Boolean).reduce((sum, file) => sum + file.size, 0)

        const totalAfterUpload = currentUsage + totalUploadSize

        if (totalAfterUpload > maxStorage) {
            throw new BadRequestException(`Превышен лимит хранения файлов. Максимальный размер хранилища: ${maxStorage} байт.`)
        } else {
            console.log(`Storage check passed. Remaining space after upload: ${maxStorage - totalAfterUpload} bytes`)
        }
    }
}

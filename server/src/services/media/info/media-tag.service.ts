import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { MediaEntity } from './entities/media.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TagsService } from '@services/tags/tags.service'

@Injectable()
export class MediaTagService {

    constructor(
        @InjectRepository(MediaEntity)
        private mediaInfoRepository: Repository<MediaEntity>,

        @Inject(forwardRef(() => TagsService))
        private readonly tagsService: TagsService,
    ) {}

    /**
     * Добавляет теги к медиафайлу
     */
    async addTagsToMedia(mediaId: string, tagIds: string[]) {
        const media = await this.mediaInfoRepository.findOne({
            where: { id: mediaId },
            relations: ['tags']
        })

        if (!media) {
            throw new NotFoundException(`Медиа с ID "${mediaId}" не найден`)
        }

        const tags = await this.tagsService.findTagsByIds(tagIds)

        if (tags.length !== tagIds.length) {
            throw new BadRequestException('One or more tags not found')
        }

        media.tags = [...media.tags, ...tags]
        return this.mediaInfoRepository.save(media)
    }

    /**
     * Удаляет теги с медиафайла
     */
    async removeTagsFromMedia(mediaId: string, tagIds: string[]) {
        const media = await this.mediaInfoRepository.findOne({
            where: { id: mediaId },
            relations: ['tags']
        })

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
        })

        if (!media) {
            throw new NotFoundException(`Медиа с ID "${mediaId}" не найден`)
        }

        return media.tags
    }
}

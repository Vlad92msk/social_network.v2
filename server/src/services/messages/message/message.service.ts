import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { LessThan, Repository } from 'typeorm'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateMessageDto } from './dto/update-message.dto'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { UserInfoService } from '@services/users/user-info/user-info.service'
import { RequestParams } from '@shared/decorators'
import { FindMessageDto } from './dto/find-message.dto'
import {
    addMultipleRangeFilters,
    createPaginationQueryOptions,
    createPaginationResponse,
    updateEntityParams
} from '@shared/utils'
import { MessageEntity } from './entity/message.entity'
import { ReactionEntity } from '@shared/entity/reaction.entity'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(MessageEntity)
        private messageRepository: Repository<MessageEntity>,

        @Inject(forwardRef(() => MediaInfoService))
        private mediaInfoService: MediaInfoService,

        @Inject(forwardRef(() => UserInfoService))
        private userInfoService: UserInfoService,

        @InjectRepository(ReactionEntity)
        private reactionRepository: Repository<ReactionEntity>,
    ) {}

    /**
     * Создать новое сообщение
     * @param createMessageDto - DTO с данными для создания сообщения
     * @param media - прикрепленные медиафайлы
     * @param voices - прикрепленные голосовые сообщения
     * @param videos - прикрепленные видео
     * @param params - параметры запроса
     * @returns Promise<MessageEntity>
     */
    async create(
        { createMessageDto, media, voices, videos }: { createMessageDto: CreateMessageDto, media: Express.Multer.File[], voices: Express.Multer.File[], videos: Express.Multer.File[] },
        params: RequestParams
    ) {
        const author = await this.userInfoService.getUsersById(params.user_info_id)

        const message = this.messageRepository.create({
            author,
            text: createMessageDto.text,
            is_forwarded: createMessageDto.is_forwarded,
        })

        if (media) {
            message.media = await this.mediaInfoService.uploadFiles(media, author.id)
        }
        if (voices) {
            message.voices = await this.mediaInfoService.uploadFiles(voices, author.id)
        }
        if (videos) {
            message.videos = await this.mediaInfoService.uploadFiles(videos, author.id)
        }

        if (createMessageDto.reply_to_id) {
            message.reply_to = await this.findOne(createMessageDto.reply_to_id)
        }

        if (createMessageDto.original_message_id) {
            message.original_message = await this.findOne(createMessageDto.original_message_id)
            message.is_forwarded = true
        }

        if (createMessageDto.media_ids) {
            const { data } = await this.mediaInfoService.getFiles({ file_ids: createMessageDto.media_ids })
            message.media = [...(message.media || []), ...data]
        }

        return this.messageRepository.save(message)
    }

    /**
     * Обновить существующее сообщение
     * @param id - идентификатор сообщения
     * @param updateMessageDto - DTO с данными для обновления
     * @param media - новые медиафайлы
     * @param voices - новые голосовые сообщения
     * @param videos - новые видео
     * @param userId - идентификатор пользователя, выполняющего обновление
     * @returns Promise<MessageEntity>
     */
    async update(
        id: string,
        { updateMessageDto, media, voices, videos }: { updateMessageDto: UpdateMessageDto, media: Express.Multer.File[], voices: Express.Multer.File[], videos: Express.Multer.File[] },
        userId: number
    ) {
        const message = await this.messageRepository.findOne({
            where: { id },
            relations: ['media', 'voices', 'videos', 'author']
        })

        if (!message) throw new NotFoundException(`Сообщение с ID "${id}" не найдено`)
        if (message.author.id !== userId) throw new BadRequestException('Вы не можете обновить чужое сообщение')

        updateEntityParams(
            message,
            updateMessageDto,
            ['text', 'is_forwarded']
        )

        if (media) {
            const addMedia = await this.mediaInfoService.uploadFiles(media, userId)
            message.media = [...(message.media || []), ...addMedia]
        }

        if (voices) {
            const addVoices = await this.mediaInfoService.uploadFiles(voices, userId)
            message.voices = [...(message.voices || []), ...addVoices]
        }

        if (videos) {
            const addVideos = await this.mediaInfoService.uploadFiles(videos, userId)
            message.videos = [...(message.videos || []), ...addVideos]
        }

        if (updateMessageDto.remove_media_ids) {
            message.media = (message.media || []).filter((media) => !updateMessageDto.remove_media_ids.includes(media.id))
        }
        if (updateMessageDto.remove_voice_ids) {
            message.voices = (message.voices || []).filter((voice) => !updateMessageDto.remove_voice_ids.includes(voice.id))
        }
        if (updateMessageDto.remove_video_ids) {
            message.videos = (message.videos || []).filter((video) => !updateMessageDto.remove_video_ids.includes(video.id))
        }

        message.is_edited = true
        return this.messageRepository.save(message)
    }

    /**
     * Получить список всех сообщений с возможностью фильтрации по диапазонам
     * @param query - параметры запроса для фильтрации и пагинации
     * @param params - дополнительные параметры запроса
     * @returns Promise<PaginatedResponse<MessageEntity>>
     */
    async findAll(query: FindMessageDto, params: RequestParams) {
        const {
            forward_count_min,
            forward_count_max,
            date_created_from,
            date_created_to,
            ...restQuery
        } = query

        const queryOptions = createPaginationQueryOptions<MessageEntity>({
            query: restQuery,
            options: {
                relations: ['media', 'voices', 'videos', 'reply_to', 'original_message']
            }
        })

        if (!queryOptions.where) {
            queryOptions.where = {}
        }

        addMultipleRangeFilters(queryOptions.where, {
            forward_count: { min: forward_count_min, max: forward_count_max },
            date_created: { min: date_created_from, max: date_created_to }
        })

        const [messages, total] = await this.messageRepository.findAndCount(queryOptions)
        return createPaginationResponse({ data: messages, total, query })
    }


    /**
     * Найти сообщение по идентификатору
     * @param id - идентификатор сообщения
     * @returns Promise<MessageEntity>
     * @throws NotFoundException если сообщение не найдено
     */
    async findOne(id: string) {
        const message = await this.messageRepository.findOne({
            where: { id },
            relations: ['media', 'voices', 'videos', 'reply_to', 'original_message']
        })
        if (!message) {
            throw new NotFoundException(`Сообщение с ID "${id}" не найдено`)
        }
        return message
    }

    /**
     * Удалить сообщение
     * @param id - идентификатор сообщения
     * @returns Promise<void>
     */
    async remove(id: string) {
        const message = await this.findOne(id)
        if (message.media && message.media.length > 0) {
            for (const media of message.media) {
                await this.mediaInfoService.deleteFile(media.id)
            }
        }
        if (message.voices && message.voices.length > 0) {
            for (const voice of message.voices) {
                await this.mediaInfoService.deleteFile(voice.id)
            }
        }
        if (message.videos && message.videos.length > 0) {
            for (const video of message.videos) {
                await this.mediaInfoService.deleteFile(video.id)
            }
        }
        await this.messageRepository.remove(message)
    }

    /**
     * Отметить сообщение как доставленное
     * @param id - идентификатор сообщения
     * @returns Promise<MessageEntity>
     */
    async markAsDelivered(id: string) {
        const message = await this.findOne(id)
        message.date_delivered = new Date()
        return this.messageRepository.save(message)
    }

    /**
     * Отметить сообщение как прочитанное
     * @param id - идентификатор сообщения
     * @returns Promise<MessageEntity>
     */
    async markAsRead(id: string) {
        const message = await this.findOne(id)
        message.date_read = new Date()
        return this.messageRepository.save(message)
    }

    /**
     * Создать пересланное сообщение
     * @param originalMessageId - идентификатор оригинального сообщения
     * @param params - параметры запроса
     * @param text - опциональный текст для нового сообщения
     * @returns Promise<MessageEntity>
     */
    async createForwardedMessage(originalMessageId: string, params: RequestParams, text?: string) {
        const author = await this.userInfoService.getUsersById(params.user_info_id)

        const originalMessage = await this.findOne(originalMessageId)
        const forwardedMessage = this.messageRepository.create({
            original_message: originalMessage,
            is_forwarded: true,
            text: text || originalMessage.text,
            author,
        })

        originalMessage.forward_count += 1
        await this.messageRepository.save(originalMessage)

        return this.messageRepository.save(forwardedMessage)
    }

    /**
     * Создать ответ на сообщение
     * @param replyToId - идентификатор сообщения, на которое отвечаем
     * @param createMessageDto - DTO с данными для создания ответа
     * @param media - прикрепленные медиафайлы
     * @param voices - прикрепленные голосовые сообщения
     * @param videos - прикрепленные видео
     * @param params - параметры запроса
     * @returns Promise<MessageEntity>
     */
    async createReply(
        replyToId: string,
        { createMessageDto, media, voices, videos }: { createMessageDto: CreateMessageDto, media: Express.Multer.File[], voices: Express.Multer.File[], videos: Express.Multer.File[] },
        params: RequestParams
    ) {
        const replyTo = await this.findOne(replyToId)
        return this.create({ createMessageDto: {...createMessageDto, reply_to: replyTo}, media, videos, voices }, params)
    }

    /**
     * Получить все медиафайлы, связанные с сообщением
     */
    async getAllMediaForMessage(messageId: string) {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['media', 'voices', 'videos']
        })

        if (!message) {
            throw new NotFoundException(`Сообщение с ID "${messageId}" не найдено`)
        }

        return {
            media: message.media || [],
            voices: message.voices || [],
            videos: message.videos || []
        }
    }

    /**
     * Получить цепочку ответов на сообщение
     * @param messageId - идентификатор исходного сообщения
     * @returns Promise<MessageEntity[]>
     */
    async getReplyChain(messageId: string) {
        const message = await this.findOne(messageId)
        const chain = [message]

        let currentMessage = message
        while (currentMessage.reply_to) {
            currentMessage = await this.findOne(currentMessage.reply_to.id)
            chain.unshift(currentMessage)
        }

        return chain
    }

    /**
     * Добавить реакцию к сообщению
     * @param messageId - идентификатор сообщения
     * @param userId - идентификатор пользователя, добавляющего реакцию
     * @param emoji - эмодзи реакции
     * @returns Promise<ReactionEntity>
     */
    async addReaction(messageId: string, userId: number, emoji: string) {
        const message = await this.findOne(messageId)
        const user = await this.userInfoService.getUsersById(userId)

        const reaction = this.reactionRepository.create({
            message,
            user,
            emoji,
        })

        return this.reactionRepository.save(reaction)
    }

    /**
     * Удалить реакцию с сообщения
     * @param reactionId - идентификатор реакции
     * @param userId - идентификатор пользователя, удаляющего реакцию
     * @returns Promise<void>
     */
    async removeReaction(reactionId: string, userId: number) {
        const reaction = await this.reactionRepository.findOne({
            where: { id: reactionId },
            relations: ['user'],
        })

        if (!reaction) {
            throw new NotFoundException('Реакция не найдена')
        }

        if (reaction.user.id !== userId) {
            throw new ForbiddenException('Вы не можете удалить чужую реакцию')
        }

        await this.reactionRepository.remove(reaction)
    }

    /**
     * Получить все реакции на сообщение
     * @param messageId - идентификатор сообщения
     * @returns Promise<ReactionEntity[]>
     */
    async getReactions(messageId: string) {
        const message = await this.findOne(messageId)
        return this.reactionRepository.find({
            where: { message: { id: messageId } },
            relations: ['user'],
        })
    }

    /**
     * Выполнить полнотекстовый поиск по сообщениям
     * @param searchTerm - поисковый запрос
     * @param params - параметры запроса
     * @returns Promise<PaginatedResponse<MessageEntity>>
     */
    async fullTextSearch(searchTerm: string, params: RequestParams) {
        const queryBuilder = this.messageRepository.createQueryBuilder('message')

        queryBuilder
            .where('to_tsvector(message.text) @@ plainto_tsquery(:searchTerm)', { searchTerm })
            .orderBy('ts_rank(to_tsvector(message.text), plainto_tsquery(:searchTerm))', 'DESC')
            .setParameter('searchTerm', searchTerm)

        const [messages, total] = await queryBuilder.getManyAndCount()

        return createPaginationResponse({ data: messages, total, query: { page: 1, limit: 20 } })
    }

    /**
     * Получить количество реакций на сообщение
     * @param messageId - идентификатор сообщения
     * @param emoji - опциональный параметр для подсчета конкретной реакции
     * @returns Promise<number>
     */
    async getReactionCount(messageId: string, emoji?: string) {
        const query = this.reactionRepository.createQueryBuilder('reaction')
            .where('reaction.messageId = :messageId', { messageId })

        if (emoji) {
            query.andWhere('reaction.emoji = :emoji', { emoji })
        }

        return query.getCount()
    }

    /**
     * Проверить, отреагировал ли пользователь на сообщение
     * @param messageId - идентификатор сообщения
     * @param userId - идентификатор пользователя
     * @param emoji - опциональный параметр для проверки конкретной реакции
     * @returns Promise<boolean>
     */
    async hasUserReacted(messageId: string, userId: number, emoji?: string) {
        const query = this.reactionRepository.createQueryBuilder('reaction')
            .where('reaction.messageId = :messageId', { messageId })
            .andWhere('reaction.userId = :userId', { userId })

        if (emoji) {
            query.andWhere('reaction.emoji = :emoji', { emoji })
        }

        const count = await query.getCount()
        return count > 0
    }

    /**
     * Создать временное сообщение с автоматическим удалением
     * @param createMessageDto - DTO с данными для создания сообщения
     * @param expirationTime - время жизни сообщения в секундах
     * @param params - параметры запроса
     * @returns Promise<MessageEntity>
     */
    async createTemporaryMessage(createMessageDto: CreateMessageDto, expirationTime: number, params: RequestParams) {
        const message = await this.create({ createMessageDto, media: [], voices: [], videos: [] }, params)
        message.expiration_date = new Date(Date.now() + expirationTime * 1000)
        return this.messageRepository.save(message)
    }

    /**
     * Автоматическое удаление истекших временных сообщений
     * Выполняется по расписанию каждые 10 минут
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async deleteExpiredMessages() {
        const expiredMessages = await this.messageRepository.find({
            where: {
                expiration_date: LessThan(new Date())
            }
        })

        for (const message of expiredMessages) {
            await this.remove(message.id)
        }
    }
}

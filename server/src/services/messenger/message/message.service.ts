import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { MediaEntitySourceType } from '@services/media/info/entities/media.entity'
import { DialogEvents } from '@services/messenger/dialog/types'
import { PublicationType } from '@shared/entity/publication.entity'
import { LessThan, Repository } from 'typeorm'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateMessageDto } from './dto/update-message.dto'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { UserInfoService } from '@services/users/user-info/user-info.service'
import { RequestParams } from '@shared/decorators'
import { FindMessageDto } from './dto/find-message.dto'
import { createPaginationAndOrder, createPaginationResponse, updateEntityParams } from '@shared/utils'
import { MessageEntity } from './entity/message.entity'
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

        private eventEmitter: EventEmitter2,
    ) {}

    /**
     * Создать новое сообщение
     */
    async create(
        { createMessageDto, media, voices, videos }:
        {
            createMessageDto: CreateMessageDto,
            media: Express.Multer.File[],
            voices: Express.Multer.File[],
            videos: Express.Multer.File[]
        },
        params: RequestParams
    ) {
        const author = await this.userInfoService.getUsersById(params.user_info_id)

        const message = this.messageRepository.create({
            author,
            text: createMessageDto.text,
            is_forwarded: createMessageDto.is_forwarded,
            date_updated: null,
            type: PublicationType.MESSAGE,
        })

        if (media) {
            message.media = await this.mediaInfoService.uploadFiles(media, author.id, MediaEntitySourceType.USER_INFO)
        }
        if (voices) {
            message.voices = await this.mediaInfoService.uploadFiles(voices, author.id, MediaEntitySourceType.USER_INFO)
        }
        if (videos) {
            message.videos = await this.mediaInfoService.uploadFiles(videos, author.id, MediaEntitySourceType.USER_INFO)
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
     */
    async update(
        id: string,
        { updateMessageDto, media, voices, videos }:
          {
              updateMessageDto: UpdateMessageDto,
              media: Express.Multer.File[],
              voices: Express.Multer.File[],
              videos: Express.Multer.File[]
          },
        params: RequestParams
    ) {
        const { user_info_id } = params
        const message = await this.messageRepository.findOne({
            where: { id },
            relations: ['media', 'voices', 'videos', 'author', 'dialog']
        })

        if (!message) throw new NotFoundException(`Сообщение с ID "${id}" не найдено`)
        if (message.author.id !== user_info_id) throw new BadRequestException('Вы не можете обновить чужое сообщение')

        updateEntityParams(
            message,
            updateMessageDto,
            ['text', 'is_forwarded']
        )

        if (media) {
            const addMedia = await this.mediaInfoService.uploadFiles(media, user_info_id, MediaEntitySourceType.PUBLICATION)
            message.media = [...(message.media || []), ...addMedia]
        }

        if (voices) {
            const addVoices = await this.mediaInfoService.uploadFiles(voices, user_info_id, MediaEntitySourceType.PUBLICATION)
            message.voices = [...(message.voices || []), ...addVoices]
        }

        if (videos) {
            const addVideos = await this.mediaInfoService.uploadFiles(videos, user_info_id, MediaEntitySourceType.PUBLICATION)
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

        const savedMessage = await this.messageRepository.save(message)

        this.eventEmitter.emit(DialogEvents.CHANGED_MESSAGE, { message: savedMessage, creator: params })
        return savedMessage
    }

    /**
     * Получить список всех сообщений с возможностью фильтрации по диапазонам
     */
    async findAll(query: FindMessageDto, params: RequestParams) {
        const {
            forward_count_min,
            forward_count_max,
            date_created_from,
            date_created_to,
            ...restQuery
        } = query

        const { page, per_page, sort_by, sort_direction } = query

        const paginationAndOrder = createPaginationAndOrder({
            page,
            per_page,
            sort_by,
            sort_direction
        })

        // const queryOptions = createPaginationQueryOptions<MessageEntity>({
        //     query: restQuery,
        //     options: {
        //         relations: ['media', 'voices', 'videos', 'reply_to', 'original_message']
        //     }
        // })
        //
        // if (!queryOptions.where) {
        //     queryOptions.where = {}
        // }

        // addMultipleRangeFilters(queryOptions.where, {
        //     forward_count: { min: forward_count_min, max: forward_count_max },
        //     date_created: { min: date_created_from, max: date_created_to }
        // })

        const [messages, total] = await this.messageRepository.findAndCount({
            where: {
                // ...omit(restQuery, 'dialog_id'),
                dialog: { id: restQuery?.dialog_id }
            },
            ...paginationAndOrder,
            relations: [
              'media',
                'voices',
                'videos',
                'reply_to',
                'original_message'
            ]
        })
        return createPaginationResponse({ data: messages, total, query })
    }


    /**
     * Найти сообщение по идентификатору
     */
    async findOne(id: string) {
        const message = await this.messageRepository.findOne({
            where: { id },
            relations: ['media', 'voices', 'videos', 'reply_to', 'original_message', 'reactions', 'reactions.reaction', 'dialog']
        })
        if (!message) {
            throw new NotFoundException(`Сообщение с ID "${id}" не найдено`)
        }
        return message
    }

    /**
     * Удалить сообщение
     */
    async remove(id: string, params: RequestParams) {
        const message = await this.messageRepository.findOne({
            where: { id },
            relations: ['media', 'voices', 'videos', 'dialog']
        })
        if (!message) {
            throw new NotFoundException(`Сообщение с ID "${id}" не найдено`)
        }

        const allMedia = [
            ...(message.media || []),
            ...(message.voices || []),
            ...(message.videos || [])
        ]

        for (const media of allMedia) {
            await this.mediaInfoService.deleteFile(media.id, params)
        }
        await this.messageRepository.remove(message)
        this.eventEmitter.emit(DialogEvents.REMOVE_MESSAGE, { dialogId: message.dialog.id, messageId: id, creator: params })
    }

    /**
     * Отметить сообщение как доставленное
     */
    async markAsDelivered(id: string) {
        const message = await this.findOne(id)
        message.date_delivered = new Date()
        return this.messageRepository.save(message)
    }

    /**
     * Отметить сообщение как прочитанное
     */
    async markAsRead(id: string) {
        const message = await this.findOne(id)
        message.date_read = new Date()
        return this.messageRepository.save(message)
    }

    /**
     * Создать пересланное сообщение
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
     * Выполнить полнотекстовый поиск по сообщениям
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
     * Создать временное сообщение с автоматическим удалением
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
            // @ts-ignore
            await this.remove(message.id, {user_info_id: message.author.id})
        }
    }

    async findLastMessageForDialog(dialogId: string) {
        return this.messageRepository.findOne({
            where: { dialog: { id: dialogId } },
            order: { date_created: 'DESC' }
        })
    }
}

import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MediaEntitySourceType } from '@services/media/info/entities/media.entity'
import { omit } from 'lodash'
import { DataSource, Repository } from 'typeorm'
import { DialogEntity } from './entities/dialog.entity'
import { CreateDialogDto } from './dto/create-dialog.dto'
import { UpdateDialogDto } from './dto/update-dialog.dto'
import { FindDialogDto } from './dto/find-dialog.dto'
import { UserInfoService } from '@services/users/user-info/user-info.service'
import { MessageService } from '@services/messenger/message/message.service'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { RequestParams } from '@shared/decorators'
import { createPaginationQueryOptions, createPaginationResponse } from '@shared/utils'
import { DialogShortDto } from '@services/messenger/dialog/dto/dialog-short.dto'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { MessageEntity } from '@services/messenger/message/entity/message.entity'
import { DialogEvents } from './types'
import { ConferenceService } from '@services/messenger/conference/conference.service'
import { VideoConferenceEvents } from '@services/messenger/conference/types'

@Injectable()
export class DialogService {
    constructor(
        @InjectRepository(DialogEntity)
        private dialogRepository: Repository<DialogEntity>,

        @Inject(forwardRef(() => UserInfoService))
        private userInfoService: UserInfoService,

        @Inject(forwardRef(() => MessageService))
        private messageService: MessageService,

        @Inject(forwardRef(() => MediaInfoService))
        private mediaInfoService: MediaInfoService,

        @Inject(forwardRef(() => ConferenceService))
        private videoConferenceService: ConferenceService,

        private eventEmitter: EventEmitter2,
      private readonly dataSource: DataSource
    ) {}

    /**
     * Получение всех медиафайлов диалога
     */
    async getAllMediaForDialog(id: string) {
        const dialog = await this.findOne(id)
        const allMedia = []

        for (const message of dialog.messages) {
            const messageMedia = await this.messageService.getAllMediaForMessage(message.id)
            allMedia.push(...messageMedia.media, ...messageMedia.voices, ...messageMedia.videos)
        }

        return allMedia
    }

    /**
     * Обновление настроек диалога
     */
    async updateDialogOptions(id: string, options: { hide_me?: boolean; notify?: boolean }, userId: number) {
        const dialog = await this.findOne(id)

        if (!dialog.participants.some(participant => participant.id === userId)) {
            throw new BadRequestException('Вы не являетесь участником этого диалога')
        }

        dialog.options = { ...dialog.options, ...options }
        return this.dialogRepository.save(dialog)
    }

    /**
     * Получение диалогов по участнику
     */
    async getDialogsByParticipant(userId: number) {
        return this.dialogRepository.find({
            where: { participants: { id: userId } },
            relations: ['participants', 'admins'],
        })
    }


    /**
     * Получение администраторов диалога
     */
    async getDialogAdmins(id: string) {
        const dialog = await this.findOne(id)
        return dialog.admins
    }

    /**
     * Покинуть диалог
     */
    async exitFromDialog(id: string, userId: number, paramas: RequestParams) {
        const dialog = await this.findOne(id)

        if (!dialog.participants.some(participant => participant.id === userId)) {
            throw new BadRequestException('Вы не являетесь участником этого диалога')
        }

        dialog.participants = dialog.participants.filter(participant => participant.id !== userId)

        // Если пользователь был администратором, удаляем его из списка администраторов
        dialog.admins = dialog.admins.filter(admin => admin.id !== userId)

        // Если диалог остался без участников, удаляем его
        if (dialog.participants.length === 0) {
            await this.dialogRepository.remove(dialog)
            return { message: 'Диалог удален, так как все участники покинули его' }
        }

        // Если диалог остался без администраторов, назначаем первого участника администратором
        if (dialog.admins.length === 0) {
            dialog.admins.push(dialog.participants[0])
        }

        await this.dialogRepository.save(dialog)

        this.eventEmitter.emit(DialogEvents.EXIT_DIALOG, { id, participants: [userId]})

        return { message: 'Вы успешно покинули диалог' }
    }

    /**
     * Создать диалог
     */
    async create({ query, image }: { query?: CreateDialogDto, image?: Express.Multer.File }, params: RequestParams) {
        const creator = await this.userInfoService.getUsersById(params.user_info_id)
        const participants = await this.userInfoService.getSomeUsersById(query?.participants)

        const dialog = this.dialogRepository.create({
            ...omit(query, ['participants', 'admins']),
            admins: [creator],
            participants: [...participants, creator],
        })

        if (image) {
            const [uploadedFile] = await this.mediaInfoService.uploadFiles([image], params.user_info_id, MediaEntitySourceType.DIALOG)
            dialog.image = uploadedFile.meta.src
        }

        const createdDialog = await this.dialogRepository.save(dialog)
        return createdDialog
    }

    /**
     * Обновить диалог
     */
    async update(id: string, { query, image }: { query: UpdateDialogDto, image: Express.Multer.File }, params: RequestParams) {
        const dialog = await this.dialogRepository.findOne({
            where: { id },
            relations: ['admins', 'participants']
        })

        if (!dialog) {
            throw new NotFoundException(`Диалог с ID "${id}" не найден`)
        }

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для обновления этого диалога')
        }

        // Обновляем поля диалога
        Object.assign(dialog, omit(query, ['add_participants', 'remove_participants']))

        // Добавляем участников к диалогу
        if (query?.add_participants) {
            const newParticipants = await Promise.all(
              query.add_participants.map(id => this.userInfoService.getUsersById(id))
            )
            dialog.participants = [...(dialog.participants || []), ...newParticipants]
        }
        // Удаляем участников из диалога
        if (query?.remove_participants) {
            const newParticipants = dialog.participants?.filter(({ id }) => !query.remove_participants.includes(id))
            dialog.participants = newParticipants
        }

        if (image) {
            const [uploadedFile] = await this.mediaInfoService.uploadFiles([image], params.user_info_id, MediaEntitySourceType.DIALOG)
            dialog.image = uploadedFile.meta.src
        }

        return await this.dialogRepository.save(dialog)
    }

    /**
     * Найти все диалоги
     */
    async findAll(query: FindDialogDto, params: RequestParams) {
        const [dialogs, total] = await this.dialogRepository.findAndCount({
            where: {
                type: query?.type,
                participants: { id: query?.participant_id || params.user_info_id }
            },
            relations: ['participants', 'admins'],
        })
        return createPaginationResponse({ data: dialogs, total, query })
    }

    /**
     * Получить инф о диалоге для подключившегося пользователя
     */
    async getDialogInfo(
      id: string,
      options?: {
          relations?: {
              participants?: boolean,
              admins?: boolean,
              fixed_messages?: boolean,
              media?: boolean,
              audio?: boolean,
              videos?: boolean,
              messages?: boolean, // Добавляем возможность загрузки сообщений
          };
      },
      params?: RequestParams
    ) {
        const dialog = await this.dialogRepository.findOne({
            where: { id },
            relations: {
            participants: options?.relations?.participants,
              admins: options?.relations?.admins,
              fixed_messages: options?.relations?.fixed_messages,
              messages: options?.relations?.messages, // Загружаем сообщения, если нужно
        },
        })

        // Если нужно загрузить медиафайлы (media, audio, videos)

        if (options?.relations?.media || options?.relations?.audio || options?.relations?.videos) {
            const mediaData = await this.messageService.getAllMediaForDialog(id)

            if (options.relations.media) dialog['media'] = mediaData.media
            if (options.relations.audio) dialog['voices'] = mediaData.voices
            if (options.relations.videos) dialog['videos'] = mediaData.videos
        }

        return dialog
    }


    /**
     * Найти диалог по ID
     */
    async findOne(id: string) {
        return await this.dialogRepository.findOne({
            where: { id },
            relations: [
                'participants',
                'admins',
                'messages',
                'fixed_messages',
                'messages.author',
                'messages.voices',
                'messages.videos',
                'messages.media'
            ]
        })
    }

    /**
     * Удалить диалог
     */
    async remove(id: string, params: RequestParams) {
        return await this.dataSource.transaction(async manager => {
            const dialog = await manager.findOne(DialogEntity, {
                where: { id },
                relations: ['admins', 'messages'] // Важно подгрузить сообщения
            })

            if (!dialog) {
                throw new NotFoundException(`Диалог с ID "${id}" не найден`)
            }

            if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
                throw new BadRequestException('У вас нет прав для удаления этого диалога')
            }

            await manager.remove(DialogEntity, dialog) // Удаление диалога с каскадным удалением сообщений
            this.eventEmitter.emit(DialogEvents.REMOVE_DIALOG, { id, participants: dialog.participants.map(({ id }) => id)})
        })
    }


    /**
     * Добавить участника в диалог
     */
    async addParticipant(dialogId: string, userId: number, params: RequestParams) {
        const dialog = await this.findOne(dialogId)
        const user = await this.userInfoService.getUsersById(userId)

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для добавления участников в этот диалог')
        }

        if (!dialog.participants.some(participant => participant.id === userId)) {
            dialog.participants.push(user)
            await this.dialogRepository.save(dialog)
            this.eventEmitter.emit(DialogEvents.DIALOG_UPDATED, dialog)
        }

        return dialog
    }

    /**
     * Удалить участника из диалога
     */
    async removeParticipant(dialogId: string, userId: number, params: RequestParams) {
        const dialog = await this.findOne(dialogId)

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для удаления участников из этого диалога')
        }

        dialog.participants = dialog.participants.filter(participant => participant.id !== userId)
        await this.dialogRepository.save(dialog)
        this.eventEmitter.emit(DialogEvents.DIALOG_UPDATED, dialog)

        return dialog
    }

    /**
     * Добавить администратора в диалог
     */
    async addAdmin(dialogId: string, userId: number, params: RequestParams) {
        const dialog = await this.findOne(dialogId)
        const user = await this.userInfoService.getUsersById(userId)

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для назначения администраторов в этом диалоге')
        }

        if (!dialog.admins.some(admin => admin.id === userId)) {
            dialog.admins.push(user)
            await this.dialogRepository.save(dialog)
            this.eventEmitter.emit(DialogEvents.DIALOG_UPDATED, dialog)
        }

        return dialog
    }

    /**
     * Удалить администратора из диалога
     */
    async removeAdmin(dialogId: string, userId: number, params: RequestParams) {
        const dialog = await this.findOne(dialogId)

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для удаления администраторов из этого диалога')
        }

        if (dialog.admins.length === 1) {
            throw new BadRequestException('Невозможно удалить последнего администратора диалога')
        }

        dialog.admins = dialog.admins.filter(admin => admin.id !== userId)
        await this.dialogRepository.save(dialog)
        this.eventEmitter.emit(DialogEvents.DIALOG_UPDATED, dialog)

        return dialog
    }

    /**
     * Закрепить сообщение в диалоге
     */
    async addFixedMessage(dialogId: string, messageId: string, params: RequestParams) {
        const dialog = await this.findOne(dialogId)
        const message = await this.messageService.findOne(messageId)

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для закрепления сообщений в этом диалоге')
        }

        if (!dialog.fixed_messages.some(fixedMessage => fixedMessage.id === messageId)) {
            dialog.fixed_messages.push(message)
            await this.dialogRepository.save(dialog)
            this.eventEmitter.emit(DialogEvents.UPDATED_FIXED_MESSAGES, { dialog_id: dialogId, new_fixed_messages: dialog.fixed_messages })
        }

        return dialog
    }

    /**
     * Открепить сообщение в диалоге
     */
    async removeFixedMessage(dialogId: string, messageId: string, params: RequestParams) {
        const dialog = await this.dialogRepository.findOne({
            where: { id: dialogId },
            relations: {
                admins: true,
                fixed_messages: true
            }
        })

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для открепления сообщений в этом диалоге')
        }

        dialog.fixed_messages = dialog.fixed_messages.filter(message => message.id !== messageId)
        const updatedDialog = await this.dialogRepository.save(dialog)
        this.eventEmitter.emit(DialogEvents.UPDATED_FIXED_MESSAGES, { dialog_id: dialogId, new_fixed_messages: updatedDialog.fixed_messages })
        return updatedDialog
    }


    /**
     * Получить количество непрочитанных сообщений в диалоге
     */
    async getUnreadMessagesCount(dialogId: string, userId: number) {
        const dialog = await this.findOne(dialogId)
        return dialog.messages_not_read.filter(messageId =>
            dialog.messages.find(message => message.id === messageId && message.author.id !== userId)
        ).length
    }

    /**
     * Отметить все сообщения в диалоге как прочитанные
     */
    async markMessagesAsRead(dialogId: string, params: RequestParams) {
        const dialog = await this.dialogRepository.findOne({
            where: { id: dialogId },
            relations: ['messages', 'messenger.author']
        })

        if (!dialog) {
            throw new NotFoundException(`Диалог с ID "${dialogId}" не найден`)
        }

        const messagesToMark = dialog.messages_not_read.filter(messageId =>
            dialog.messages.find(message => message.id === messageId && message.author.id !== params.user_info_id)
        )

        for (const messageId of messagesToMark) {
            await this.messageService.markAsRead(messageId)
        }

        dialog.messages_not_read = dialog.messages_not_read.filter(messageId => !messagesToMark.includes(messageId))

        const updatedDialog = await this.dialogRepository.save(dialog)
        return updatedDialog
    }


    async findAllShort(query: FindDialogDto, params: RequestParams) {
        const queryOptions = createPaginationQueryOptions<DialogEntity>({
            query,
            options: {
                relations: ['participants'],
            }
        })

        if (query.participant_id) {
            queryOptions.where = {
                ...queryOptions.where,
                participants: { id: query.participant_id },
            }
        }

        const [dialogs, total] = await this.dialogRepository.createQueryBuilder('dialog')
          .leftJoinAndSelect('dialog.participants', 'participant')
          .leftJoinAndSelect('dialog.messages', 'message')
          .where(queryOptions.where)
          .orderBy('dialog.id', 'ASC')
          .addOrderBy('message.date_created', 'DESC')
          .skip(queryOptions.skip)
          .take(queryOptions.take)
          .select([
              'dialog',
              'participant',
              'message',
          ])
          .getManyAndCount()

        console.log('___dialogs', dialogs)
        const shortDialogs = dialogs.map(dialog => {
            const lastMessage = dialog.messages.length > 0 ? dialog.messages[0] : undefined
            return this.mapToDialogShortDto({ dialog, lastMessage }, params)
        })

        return createPaginationResponse({ data: shortDialogs, total, query })
    }

    async findOneShort(id: string, params: RequestParams): Promise<DialogShortDto> {
        const dialog = await this.dialogRepository.findOne({
            where: { id },
            relations: ['participants'],
        })

        if (!dialog) {
            throw new NotFoundException(`Диалог с ID "${id}" не найден`)
        }

        const lastMessage = await this.getLastMessage(dialog.id)
        return this.mapToDialogShortDto({ dialog, lastMessage }, params)
    }

    async findShortByUser(userId: number, params: RequestParams): Promise<DialogShortDto[]> {
        const dialogs = await this.dialogRepository.createQueryBuilder('dialog')
          // Выбираем какие связи нам нужны
          .leftJoinAndSelect('dialog.participants', 'participants')
          .leftJoinAndSelect('dialog.admins', 'admins')
          .leftJoinAndSelect('dialog.fixed_messages', 'fixed_messages')
          // Из сообщений берем только последнее
          .leftJoinAndSelect(
            'dialog.messages',
            'messages',
            'messages.id = (SELECT m.id FROM messages m WHERE m."dialogId" = dialog.id ORDER BY m.date_created DESC LIMIT 1)'
          )
          // Добавляем к получившемуся сообщение связь с автором
          .leftJoinAndSelect('messages.author', 'message_author')
          // Сам запрос диалогов фильтруем только по текущему пользователю (userId)
          .where(qb => {
              const subQuery = qb.subQuery()
                .select('d.id')
                .from(DialogEntity, 'd')
                .innerJoin('d.participants', 'p')
                .where('p.id = :userId')
                .getQuery()
              return 'dialog.id IN ' + subQuery
          })
          // Устанавливаем значение для userId
          .setParameter('userId', userId)
          .addOrderBy('messages.date_created', 'DESC')
          .select([
              'dialog',
              'participants',
              'admins',
              'dialog.title',
              'dialog.image',
              'dialog.description',
              'fixed_messages',
              'messages',
              'message_author',
          ])
          .getMany()


        return dialogs.map(dialog => {
            const lastMessage = dialog.messages && dialog.messages[0]
            return this.mapToDialogShortDto({ dialog, lastMessage }, params)
        })
    }

    mapToDialogShortDto({ dialog, lastMessage }:{ dialog: DialogEntity, lastMessage?: MessageEntity }, params: RequestParams): DialogShortDto {
        const [participant] = dialog.participants.filter(({ id }) => id !== params?.user_info_id)

        return {
            id: dialog.id,
            title: dialog.title ?? participant?.name,
            image: dialog.image ?? participant?.profile_image,
            type: dialog.type,
            last_message: lastMessage,
            unread_count: dialog.messages_not_read.length,
        }
    }

    async updateDialogImage(dialogId: string, file: Express.Multer.File, params: RequestParams) {
        const dialog = await this.findOne(dialogId)

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для обновления изображения этого диалога')
        }

        const [uploadedFile] = await this.mediaInfoService.uploadFiles([file], params.user_info_id, MediaEntitySourceType.DIALOG)
        dialog.image = uploadedFile.meta.src

        const updatedDialog = await this.dialogRepository.save(dialog)
        this.eventEmitter.emit(DialogEvents.DIALOG_IMAGE_UPDATED, { dialogId, updatedDialog })

        return updatedDialog
    }


    // Добавляет сообщение в диалог
    async addMessageToDialog(dialogId: string, message: MessageEntity, params: RequestParams) {
        const dialog = await this.dialogRepository.findOne({
            where: { id: dialogId },
            relations: ['messages', 'messages.dialog']
        })
        if (!dialog) {
            throw new NotFoundException(`Диалог с ID ${dialogId} не найден`)
        }

        // Добавляем новое сообщение в массив сообщений диалога
        dialog.messages = [...(dialog.messages || []), message]

        const last = await this.getLastMessage(dialogId)

        const updatedDialog = await this.dialogRepository.save(dialog)

        const updatedDialogShort = this.mapToDialogShortDto({ dialog: updatedDialog, lastMessage: last }, params)
        this.eventEmitter.emit(DialogEvents.DIALOG_LAST_MESSAGE_UPDATED, { dialogId, updatedDialogShort })

        return updatedDialog
    }

    async getLastMessage(dialogId: string): Promise<MessageEntity | undefined> {
        const result = await this.dialogRepository
          .createQueryBuilder('dialog')
          .where('dialog.id = :dialogId', { dialogId })
          .leftJoinAndSelect(
            'dialog.messages',
            'message',
            'message.id = (SELECT m.id FROM messages m WHERE m."dialogId" = dialog.id ORDER BY m.date_created DESC LIMIT 1)'
          )
          .leftJoinAndSelect('message.author', 'author')
          .select(['dialog.id', 'message', 'author'])
          .getOne()

        return result?.messages[0]
    }

    /**
     * Получение участников диалога
     */
    async getDialogParticipants(id: string) {
        const dialog = await this.findOne(id)
        return dialog.participants
    }

    // async createVideoConference(dialogId: string, userId: number) {
    //     const dialog = await this.findOne(dialogId)
    //     if (!dialog.participants.some(participant => participant.id === userId)) {
    //         throw new BadRequestException('Вы не являетесь участником этого диалога')
    //     }
    //
    //     if (dialog.is_video_conference_active) {
    //         return dialog.video_conference_link
    //     }
    //
    //     const link = await this.videoConferenceService.createConference(dialogId)
    //     dialog.video_conference_link = link
    //     dialog.is_video_conference_active = true
    //     await this.dialogRepository.save(dialog)
    //
    //     // Оповещаем всех участников диалога о начале видео-конференции
    //     this.eventEmitter.emit(VideoConferenceEvents.CONFERENCE_STARTED, { dialogId, initiatorId: userId })
    //
    //     return link
    // }

    // async endVideoConference(dialogId: string, userId: number) {
    //     const dialog = await this.findOne(dialogId)
    //     if (!dialog.participants.some(participant => participant.id === userId)) {
    //         throw new BadRequestException('Вы не являетесь участником этого диалога')
    //     }
    //
    //     if (!dialog.is_video_conference_active) {
    //         throw new BadRequestException('Видео-конференция не активна')
    //     }
    //
    //     await this.videoConferenceService.endConference(dialogId)
    //     dialog.is_video_conference_active = false
    //     dialog.video_conference_link = null
    //     await this.dialogRepository.save(dialog)
    //
    //     // Оповещаем всех участников диалога о завершении видео-конференции
    //     this.eventEmitter.emit(VideoConferenceEvents.CONFERENCE_ENDED, { dialogId, initiatorId: userId })
    // }

    // async checkAndCloseInactiveConferences() {
    //     const activeDialogs = await this.dialogRepository.find({
    //         where: { is_video_conference_active: true },
    //         relations: ['participants']
    //     })
    //
    //     for (const dialog of activeDialogs) {
    //         const participants = await this.videoConferenceService.getParticipants(dialog.id)
    //         if (participants.length === 0) {
    //             await this.endVideoConference(dialog.id, dialog.participants[0].id)
    //         }
    //     }
    // }
}

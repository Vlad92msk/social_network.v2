import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MediaEntitySourceType } from '@services/media/info/entities/media.entity'
import { omit } from 'lodash'
import { Repository } from 'typeorm'
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
import { SortDirection } from '@shared/types'
import { UserStatus } from '@services/users/_interfaces'
import { DialogEvents } from './types'
import { VideoConferenceService } from '@services/messenger/video-conference/video-conference.service'
import { VideoConferenceEvents } from '@services/messenger/video-conference/types'

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

        @Inject(forwardRef(() => VideoConferenceService))
        private videoConferenceService: VideoConferenceService,

        private eventEmitter: EventEmitter2,
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
            relations: ['participants', 'admins', 'last_message'],
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
    async exitFromDialog(id: string, userId: number) {
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
        const participants = await Promise.all(
            query?.participants?.map(id => this.userInfoService.getUsersById(id))
        )

        const dialog = this.dialogRepository.create({
            ...omit(query, ['participants', 'admins', 'last_message']),
            admins: [creator],
            participants: [...participants, creator],
            last_message: null
        })

        if (image) {
            const [uploadedFile] = await this.mediaInfoService.uploadFiles([image], params.user_info_id, MediaEntitySourceType.DIALOG)
            dialog.image = uploadedFile.meta.src
        }

        const f =  await this.dialogRepository.save(dialog)
        // const updatedDialogShort = this.mapToDialogShortDto(dialog, params)
        // this.eventEmitter.emit(DialogEvents.NEW_DIALOG, { dialogId: updatedDialogShort.id,dialog: updatedDialogShort })

        return f
    }

    /**
     * Обновить диалог
     */
    async update(id: string, { query, image }: { query: UpdateDialogDto, image: Express.Multer.File }, params: RequestParams) {
        const dialog = await this.dialogRepository.findOne({
            where: { id },
            relations: ['admins', 'participants', 'last_message']
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
            dialog.participants = [...(dialog.participants || []), ...newParticipants]
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
            relations: ['participants', 'admins', 'last_message'],
        })
        return createPaginationResponse({ data: dialogs, total, query })
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
        const dialog = await this.dialogRepository.findOne({
            where: { id },
            relations: ['admins']
        })

        if (!dialog) {
            throw new NotFoundException(`Диалог с ID "${id}" не найден`)
        }

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для удаления этого диалога')
        }

        await this.dialogRepository.remove(dialog)
        this.eventEmitter.emit(DialogEvents.REMOVE_DIALOG, { id, participants: dialog.participants.map(({ id }) => id)})
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
            this.eventEmitter.emit(DialogEvents.DIALOG_UPDATED, dialog)
        }

        return dialog
    }

    /**
     * Открепить сообщение в диалоге
     */
    async removeFixedMessage(dialogId: string, messageId: string, params: RequestParams) {
        const dialog = await this.findOne(dialogId)

        if (!dialog.admins.some(admin => admin.id === params.user_info_id)) {
            throw new BadRequestException('У вас нет прав для открепления сообщений в этом диалоге')
        }

        dialog.fixed_messages = dialog.fixed_messages.filter(message => message.id !== messageId)
        await this.dialogRepository.save(dialog)

        return dialog
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

        // Обновляем last_message, если оно изменилось
        const lastMessage = await this.messageService.findLastMessageForDialog(dialogId)

        if (lastMessage) {
            updatedDialog.last_message = lastMessage
            await this.dialogRepository.save(updatedDialog)
            this.eventEmitter.emit(DialogEvents.DIALOG_LAST_MESSAGE_UPDATED, { dialogId, updatedDialogShort: await this.findOneShort(dialogId, params) })
        }

        return updatedDialog
    }


    mapToDialogShortDto(dialog: DialogEntity, params: RequestParams): DialogShortDto {

        // console.log('dialog', dialog)
        // console.log('params', params)
        const lastMessage = dialog.last_message
        const [participant] = dialog.participants.filter(({ id }) => id !== params?.user_info_id)

        return {
            id: dialog.id,
            title: dialog.type === 'public' ? dialog.title : participant?.name,
            image: dialog.type === 'public' ? dialog.image : participant?.profile_image,
            type: dialog.type,
            last_message: lastMessage,
            unread_count: dialog.messages_not_read.length,
            //@ts-ignore
            _admins: dialog.admins,
            _participants: dialog.participants
        }
    }

    async findAllShort(query: FindDialogDto, params: RequestParams) {
        const queryOptions = createPaginationQueryOptions<DialogEntity>({
            query,
            options: {
                relations: ['last_message', 'participants', 'last_message.author'],
            }
        })

        if (query.participant_id) {
            queryOptions.where = {
                ...queryOptions.where,
                participants: { id: query.participant_id },
            }
        }

        const [dialogs, total] = await this.dialogRepository.findAndCount(queryOptions)
        const shortDialogs = await Promise.all(dialogs.map(dialog => this.mapToDialogShortDto(dialog, params)))
        return createPaginationResponse({ data: shortDialogs, total, query })
    }

    async findOneShort(id: string, params: RequestParams): Promise<DialogShortDto> {
        const dialog = await this.dialogRepository.findOne({
            where: { id },
            relations: ['last_message', 'participants', 'last_message.author'],
        })

        if (!dialog) {
            throw new NotFoundException(`Диалог с ID "${id}" не найден`)
        }

        return this.mapToDialogShortDto(dialog, params)
    }

    async findShortByUser(userId: number, params: RequestParams): Promise<DialogShortDto[]> {
        const dialogs = await this.dialogRepository.find({
            //@ts-ignore
            where: (qb) => {
                qb.where('participants.id = :userId', { userId });
            },
            relations: {
                admins: true,
                participants: true,
                last_message: true,
            },
        });

        return Promise.all(dialogs.map(dialog => this.mapToDialogShortDto(dialog, params)))
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
            relations: ['messages', 'last_message', 'messages.dialog', 'last_message.author']
        })
        if (!dialog) {
            throw new NotFoundException(`Диалог с ID ${dialogId} не найден`)
        }

        // Добавляем новое сообщение в массив сообщений диалога
        dialog.messages = [...(dialog.messages || []), message]

        dialog.last_message = message

        const updatedDialog = await this.dialogRepository.save(dialog)

        const updatedDialogShort = this.mapToDialogShortDto(updatedDialog, params)
        this.eventEmitter.emit(DialogEvents.DIALOG_LAST_MESSAGE_UPDATED, { dialogId, updatedDialogShort })

        return updatedDialog
    }

    /**
     * Получить сообщения диалога
     */
    async getDialogMessages(options: { dialogId: string, per_page?: number, page?: number }, params: RequestParams) {
        const dialog = await this.dialogRepository.findOne({
            where: { id: options?.dialogId },
        })

        if (!dialog) {
            throw new NotFoundException(`Диалог с ID "${options?.dialogId}" не найден`)
        }

        const messages = await this.messageService.findAll({
            dialog_id: options?.dialogId,
            per_page: options?.per_page,
            page: options?.page,
            sort_by: 'date_created',
            sort_direction: SortDirection.ASC
        }, params)

        return messages
    }

    /**
     * Получение участников диалога
     */
    async getDialogParticipants(id: string) {
        const dialog = await this.findOne(id)
        return dialog.participants
    }

    async createVideoConference(dialogId: string, userId: number) {
        const dialog = await this.findOne(dialogId)
        if (!dialog.participants.some(participant => participant.id === userId)) {
            throw new BadRequestException('Вы не являетесь участником этого диалога')
        }

        if (dialog.is_video_conference_active) {
            return dialog.video_conference_link
        }

        const link = await this.videoConferenceService.createConference(dialogId)
        dialog.video_conference_link = link
        dialog.is_video_conference_active = true
        await this.dialogRepository.save(dialog)

        // Оповещаем всех участников диалога о начале видео-конференции
        this.eventEmitter.emit(VideoConferenceEvents.CONFERENCE_STARTED, { dialogId, initiatorId: userId })

        return link
    }

    async endVideoConference(dialogId: string, userId: number) {
        const dialog = await this.findOne(dialogId)
        if (!dialog.participants.some(participant => participant.id === userId)) {
            throw new BadRequestException('Вы не являетесь участником этого диалога')
        }

        if (!dialog.is_video_conference_active) {
            throw new BadRequestException('Видео-конференция не активна')
        }

        await this.videoConferenceService.endConference(dialogId)
        dialog.is_video_conference_active = false
        dialog.video_conference_link = null
        await this.dialogRepository.save(dialog)

        // Оповещаем всех участников диалога о завершении видео-конференции
        this.eventEmitter.emit(VideoConferenceEvents.CONFERENCE_ENDED, { dialogId, initiatorId: userId })
    }

    async checkAndCloseInactiveConferences() {
        const activeDialogs = await this.dialogRepository.find({
            where: { is_video_conference_active: true },
            relations: ['participants']
        })

        for (const dialog of activeDialogs) {
            const participants = await this.videoConferenceService.getParticipants(dialog.id)
            if (participants.length === 0) {
                await this.endVideoConference(dialog.id, dialog.participants[0].id)
            }
        }
    }
}

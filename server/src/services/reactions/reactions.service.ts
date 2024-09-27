import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CommentService } from '@services/comments/comment/comment.service'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { MessageService } from '@services/messenger/message/message.service'
import { PostsService } from '@services/posts/post/post.service'
import { CreateReactionDto } from '@services/reactions/dto/create-reaction.dto'
import { Observable } from 'rxjs'
import { ReactionBaseEntity } from './entities/reaction-base.entity'
import { ReactionEntity } from './entities/reaction.entity'
import { UserInfoService } from '@services/users/user-info/user-info.service'
import { RequestParams } from '@shared/decorators'
import { Repository } from 'typeorm'

export enum ReactionTarget {
  POST = 'post' ,
  MEDIA = 'media',
  MESSAGE = 'message',
  COMMENT = 'comment'
}

export interface CalculateReactions {
  my_reaction?: string | null  // явное указание типа для свойства my_reaction
  [key: string]: string | number  // остальные ключи могут быть либо строками, либо числами
}

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(ReactionBaseEntity)
    private baseReactionRepository: Repository<ReactionBaseEntity>,

    @InjectRepository(ReactionEntity)
    private reactionRepository: Repository<ReactionEntity>,

    @Inject(forwardRef(() => PostsService))
    private postService: PostsService,

    @Inject(forwardRef(() => MediaInfoService))
    private mediaInfoService: MediaInfoService,

    @Inject(forwardRef(() => UserInfoService))
    private userInfoService: UserInfoService,

    @Inject(forwardRef(() => MessageService))
    private messageService: MessageService,

    @Inject(forwardRef(() => CommentService))
    private commentService: CommentService,
  ) {}

  async toggle(createReactionDto: CreateReactionDto, entityType: ReactionTarget, entityId: string, params: RequestParams) {
    const { name } = createReactionDto
    if (!entityId) throw new BadRequestException('Не указан ID сущности для которой добавляется emoji')

    const findUser = await this.userInfoService.getUsersById(params.user_info_id)
    if (!findUser) throw new NotFoundException('Не найден пользователь')

    // Находим или создаем базовую реакцию
    let baseReaction = await this.baseReactionRepository.findOneBy({ name })
    if (!baseReaction) {
      baseReaction = this.baseReactionRepository.create(createReactionDto)
      await this.baseReactionRepository.save(baseReaction)
    }

    // Проверяем, есть ли у пользователя реакция на эту сущность
    const existingReaction = await this.reactionRepository.findOne({
      where: {
        user: { id: findUser.id },
        [entityType]: { id: entityId },
      },
      relations: ['reaction'],
    })

    if (existingReaction) {
      if (existingReaction.reaction.name === name) {
        // Если пользователь уже ставил такую реакцию - удаляем ее
        await this.reactionRepository.remove(existingReaction)
      } else {
        // Если пользователь ставил другую реакцию - меняем на новую
        existingReaction.reaction = baseReaction
        await this.reactionRepository.save(existingReaction)
      }
    } else {
      // Если пользователь не ставил реакцию - создаем новую
      const newReaction = this.reactionRepository.create({
        reaction: baseReaction,
        user: findUser,
        [entityType]: await this.getEntityById(entityType, entityId),
      })
      await this.reactionRepository.save(newReaction)
    }

    // Обновляем сущность для получения актуальных реакций
    const updatedEntity = await this.getEntityById(entityType, entityId)

    // Рассчитываем количество всех реакций и возвращаем результат
    return this.calculateReactions(updatedEntity, name)
  }

  /**
   * Получить реакции для какой-либо сущности
   */
  async getReactions(entityType: ReactionTarget, entityId: string, params: RequestParams) {
    if (!entityId) throw new BadRequestException('Не указан ID сущности для которой добавляется emoji')

    const findUser = await this.userInfoService.getUsersById(params.user_info_id)
    if (!findUser) throw new NotFoundException('Не найден пользователь')

    // Проверяем, есть ли у пользователя реакция на эту сущность
    const existingReaction = await this.reactionRepository.findOne({
      where: {
        user: findUser,
        [entityType]: { id: entityId },
      },
      relations: ['reaction'],
    })

    const currentEntity = await this.getEntityById(entityType, entityId)

    // Проверяем, существует ли реакция, прежде чем обращаться к ее свойствам
    const userReactionName = existingReaction?.reaction?.name || null

    return this.calculateReactions(currentEntity, userReactionName)
  }

  getReactionUpdates(entityType: ReactionTarget, entityId: string, params: RequestParams): Observable<MessageEvent> {
    return new Observable((observer) => {
      const intervalId = setInterval(async () => {
        const reactions = await this.getReactions(entityType, entityId, params )
        observer.next({ data: reactions } as MessageEvent)
      }, 5000) // Проверка каждые 5 секунд

      return () => {
        clearInterval(intervalId)
      }
    })
  }

  // Метод для получения сущности по её типу и id
  private async getEntityById(entityType: ReactionTarget, entityId: string) {
    switch (entityType) {
      case ReactionTarget.POST:
        return await this.postService.findOne(entityId)
      case ReactionTarget.MEDIA:
        return await this.mediaInfoService.getFileById(entityId)
      case ReactionTarget.MESSAGE:
        return await this.messageService.findOne(entityId)
      case ReactionTarget.COMMENT:
        return await this.commentService.findOne(entityId)
      default:
        throw new BadRequestException('Неправильный тип сущности')
    }
  }


  // Метод для расчета количества реакций и определения реакции пользователя
  private async calculateReactions(entity: any, userReactionName: string): Promise<CalculateReactions> {
    const reactions = await entity.reactions
    const reactionsCount = reactions?.reduce((acc, reaction) => {
      const key = reaction.reaction.name
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      ...reactionsCount,
      my_reaction: userReactionName || null,
    }
  }
}


import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CommentTarget } from '@services/comments/comment/comment.controller'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { PostsService } from '@services/posts/post/post.service'
import { CalculateReactionsResponse } from '@services/reactions/dto/toggle-reaction-response.dto'
import { UserInfoService } from '@services/users/user-info/user-info.service'
import { RequestParams } from '@shared/decorators'
import { createPaginationQueryOptions, createPaginationAndOrder, createPaginationResponse } from '@shared/utils'
import { In, Repository, IsNull } from 'typeorm'
import { CommentResponseDto, CommentWithChildCountDto } from './dto/comment-response.dto'
import { CreateCommentDto } from './dto/create-comment.dto'
import { FindCommentDto } from './dto/find-comment.dto'
import { UpdateCommentDto } from './dto/update-comment.dto'
import { CommentEntity } from './entities/comment.entity'

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(CommentEntity)
        private readonly commentRepository: Repository<CommentEntity>,

        @Inject(forwardRef(() => PostsService))
          private postService: PostsService,

        @Inject(forwardRef(() => MediaInfoService))
        private mediaInfoService: MediaInfoService,

        @Inject(forwardRef(() => UserInfoService))
        private userInfoService: UserInfoService,
    ) {}

    async create(createCommentDto: CreateCommentDto, target: CommentTarget, entityId: string, params: RequestParams) {
        const { parent_comment_id, ...rest } = createCommentDto
        const comment = this.commentRepository.create({
            ...rest,
            date_updated: null
        })
        comment.author = await this.userInfoService.getUsersById(params.user_info_id)

        if (entityId) {
            if (target === 'post') {
                const findPost = await this.postService.findOne(entityId)
                await this.postService.incrementCommentCount(entityId)
                comment.post = findPost
            }
            if (target === 'media') {
                const findMedia = await this.mediaInfoService.getFileById(entityId)
                await this.mediaInfoService.incrementCommentCount(entityId)
                comment.media = findMedia
            }
        }

        if (parent_comment_id) {
            comment.parent_comment = await this.findOne(parent_comment_id)
        }

        return this.commentRepository.save(comment)
    }


    async findCommentsByEntity(
      entityType: CommentTarget,
      entityId: string,
      query: FindCommentDto,
      params: RequestParams
    ) {
        const { page, per_page, sort_by, sort_direction, ...restQuery} = query

        const paginationAndOrder = createPaginationAndOrder({
            page,
            per_page,
            sort_by,
            sort_direction
        })

        const [rootComments, totalRootComments] = await this.commentRepository.findAndCount({
            where: {
                ...restQuery,
                [entityType]: { id: entityId },
                parent_comment: IsNull(),
            },
            ...paginationAndOrder,
            relations: [
                'author',
                'parent_comment',
                'reactions',
                'reactions.reaction',
                'reactions.user',
            ],
        })


        // Получаем общее количество комментариев и количество дочерних комментариев
        const [totalComments, childComments] = await Promise.all([
            this.commentRepository.count({
                where: { [entityType]: { id: entityId } }
            }),
            this.commentRepository.find({
                where: {
                    [entityType]: { id: entityId },
                    parent_comment: { id: In(rootComments.map(c => c.id)) }
                },
                relations: ['parent_comment'],
                select: ['id', 'parent_comment']
            })
        ])

        // Создаем Map для подсчета дочерних комментариев
        const childCountMap = new Map<string, number>()
        childComments.forEach(comment => {
            const parentId = comment.parent_comment.id
            childCountMap.set(parentId, (childCountMap.get(parentId) || 0) + 1)
        })

        // Преобразуем rootComments в CommentWithChildCountDto
        const commentsWithChildCount: CommentWithChildCountDto[] = rootComments.map(comment => {
            return ({
                ...comment,
                reaction_info: this.calculateReactions(comment, params),
                child_count: childCountMap.get(comment.id) || 0
            })
        })

        // Создаем объект CommentResponseDto
        const commentResponseDto: CommentResponseDto = {
            data: commentsWithChildCount,
            total: totalRootComments,
            totalComments: totalComments
        }

        // Используем createPaginationResponse для формирования итогового ответа
        return createPaginationResponse({
            data: commentResponseDto,
            total: totalRootComments,
            query
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

    async getChildComments(parentId: string, query: FindCommentDto) {
        console.log('parentId', parentId)
        const queryOptions = createPaginationQueryOptions<CommentEntity>({
            query,
            options: {
                relations: ['reactions', 'author', 'parent_comment'],
                where: { parent_comment: { id: parentId } }
            }
        })

        // По умолчанию сортируем по дате создания (новые первыми)
        if (!query.sort_by) {
            queryOptions.order = { date_created: 'DESC' }
        }

        const [childComments, total] = await this.commentRepository.findAndCount(queryOptions)

        return createPaginationResponse({ data: childComments, total, query })
    }


    async findAll(query: FindCommentDto, params: RequestParams) {
        const queryOptions = createPaginationQueryOptions({ query, options:{ relations: ['parent_comment', 'reactions'] } })
        const [tags, total] = await this.commentRepository.findAndCount(queryOptions)
        return createPaginationResponse({ data: tags, total, query })
    }

    async findOne(id: string) {
        return await this.commentRepository.findOne({
            where: { id },
            relations: ['parent_comment', 'reactions', 'reactions.reaction']
        })
    }

    async update(id: string, updateCommentDto: UpdateCommentDto) {
        await this.commentRepository.update(id, updateCommentDto)
        return this.commentRepository.findOne({ where: { id } })
    }

    async remove(id: string, params: RequestParams) {
        const comment = await this.commentRepository.findOne({
            where: { id },
            relations: ['author', 'post', 'media', 'parent_comment']
        })

        if (!comment) {
            throw new NotFoundException('Comment not found')
        }

        // Check if the user is the author of the comment
        if (comment.author.id !== params.user_info_id) {
            throw new BadRequestException('You can only delete your own comments')
        }

        // If the comment has child comments, mark it as deleted instead of removing it
        const hasChildren = await this.commentRepository.count({ where: { parent_comment: { id } } }) > 0

        if (hasChildren) {
            await this.commentRepository.save(comment)
        } else {
            // If it's a root comment, decrement the comment count on the associated entity
            if (!comment.parent_comment) {
                if (comment.post) {
                    await this.postService.decrementCommentCount(comment.post.id)
                } else if (comment.media) {
                    await this.mediaInfoService.decrementCommentCount(comment.media.id)
                }
            }

            // Delete the comment
            await this.commentRepository.remove(comment)
        }

        // If it was a child comment, check if the parent now has no children and update accordingly
        if (comment.parent_comment) {
            const parentStillHasChildren = await this.commentRepository.count({
                where: { parent_comment: { id: comment.parent_comment.id } }
            }) > 0

            if (!parentStillHasChildren) {
                const parentComment = await this.commentRepository.findOne({
                    where: { id: comment.parent_comment.id }
                })
                if (parentComment) {
                    await this.commentRepository.remove(parentComment)
                }
            }
        }

        return { message: 'Comment deleted successfully' }
    }

    /**
     * Закрепление/открепление комментария
     */
    async pinComment(postId: string, userId: number) {
        const comment = await this.commentRepository.findOne({ where: { id: postId }, relations: ['author'] })
        if (!comment) {
            throw new NotFoundException('Комментарий не найден')
        }

        if (comment.author.id !== userId) {
            throw new BadRequestException('Вы не можете закрепить чужой комментарий')
        }
        comment.is_pinned = !comment.is_pinned
        return this.commentRepository.save(comment)
    }

    async findPinnedComments(postId: string) {
        return this.commentRepository.find({
            where: { post: { id: postId }, is_pinned: true },
            relations: ['parent_comment', 'reactions']
        })
    }
}

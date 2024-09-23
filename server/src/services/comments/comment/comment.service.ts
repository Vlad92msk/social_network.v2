import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CommentTarget } from '@services/comments/comment/comment.controller'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { PostsService } from '@services/posts/post/post.service'
import { UserInfoService } from '@services/users/user-info/user-info.service'
import { RequestParams } from '@shared/decorators'
import { createPaginationQueryOptions, createPaginationResponse } from '@shared/utils'
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
        const comment = this.commentRepository.create(rest)

        comment.author = await this.userInfoService.getUsersById(params.user_info_id)

        if (entityId) {
            if (target === 'post') {
                comment.post = await this.postService.findOne(entityId)
            }
            if (target === 'media') {
                comment.media = await this.mediaInfoService.getFileById(entityId)
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
        const queryOptions = createPaginationQueryOptions<CommentEntity>({
            query,
            options: {
                relations: ['reactions', 'author', entityType, 'parent_comment'],
                where: {
                    [entityType]: { id: entityId },
                    parent_comment: IsNull(),
                }
            }
        })

        if (query.sort_by) {
            queryOptions.order = { [query.sort_by]: query.sort_direction || 'ASC' }
        } else {
            queryOptions.order = { date_created: 'DESC' }
        }

        const [rootComments, totalRootComments] = await this.commentRepository.findAndCount(queryOptions)


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
        const commentsWithChildCount: CommentWithChildCountDto[] = rootComments.map(comment => ({
            ...comment,
            child_count: childCountMap.get(comment.id) || 0
        }))

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
            relations: ['parent_comment', 'reactions']
        })
    }

    async update(id: string, updateCommentDto: UpdateCommentDto) {
        await this.commentRepository.update(id, updateCommentDto)
        return this.commentRepository.findOne({ where: { id } })
    }

    async remove(id: string) {
        await this.commentRepository.delete(id)
    }

    async pinComment(id: string, action: 'pin' | 'unpin'): Promise<CommentEntity> {
        const comment = await this.commentRepository.findOne({ where: { id } })
        if (!comment) {
            throw new NotFoundException('Комментарий не найден')
        }
        comment.is_pinned = action === 'pin'
        return this.commentRepository.save(comment)
    }

    async findPinnedComments(postId: string) {
        return this.commentRepository.find({
            where: { post: { id: postId }, is_pinned: true },
            relations: ['parent_comment', 'reactions']
        })
    }
}

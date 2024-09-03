import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CommentEntity } from './entities/comment.entity'
import { CreateCommentDto } from './dto/create-comment.dto'
import { UpdateCommentDto } from './dto/update-comment.dto'
import { FindCommentDto } from './dto/find-comment.dto'
import { RequestParams } from '@shared/decorators'
import { createPaginationQueryOptions, createPaginationResponse } from '@shared/utils'

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(CommentEntity)
        private readonly commentRepository: Repository<CommentEntity>,
    ) {}

    async create(createCommentDto: CreateCommentDto) {
        const { parent_comment_id, ...rest } = createCommentDto
        const comment = this.commentRepository.create(rest)

        if (parent_comment_id) {
            const parentComment = await this.commentRepository.findOne({ where: { id: parent_comment_id } })
            comment.parent_comment = parentComment
        }

        return this.commentRepository.save(comment)
    }

    async findCommentsByEntity(entityType: 'post' | 'media', entityId: string, query: FindCommentDto, params: RequestParams) {
        const queryOptions = createPaginationQueryOptions<CommentEntity>({
            query,
            options: {
                relations: ['reactions', 'author'],
                where: {
                    [entityType]: { id: entityId },
                    parent_comment: null,
                }
            }
        })

        if (query.sort_by) {
            queryOptions.order = { [query.sort_by]: query.sort_direction || 'ASC' }
        } else {
            queryOptions.order = { created_at: 'DESC' }
        }

        const [rootComments, totalRootComments] = await this.commentRepository.findAndCount(queryOptions)

        // Получаем общее количество комментариев и количество дочерних комментариев в одном запросе
        const [{ total: totalComments }, childCounts] = await Promise.all([
            this.commentRepository.createQueryBuilder('comment')
                .where(`comment.${entityType}Id = :entityId`, { entityId })
                .select('COUNT(*)', 'total')
                .getRawOne(),
            this.commentRepository.createQueryBuilder('comment')
                .select('comment.parent_comment_id', 'parentId')
                .addSelect('COUNT(*)', 'count')
                .where('comment.parent_comment_id IN (:...ids)', { ids: rootComments.map(c => c.id) })
                .groupBy('comment.parent_comment_id')
                .getRawMany()
        ])

        // Создаем Map для быстрого доступа к количеству дочерних комментариев
        const childCountMap = new Map(childCounts.map(item => [item.parentId, parseInt(item.count)]))

        // Добавляем количество дочерних комментариев к каждому корневому комментарию
        rootComments.forEach(comment => {
            comment['child_count'] = childCountMap.get(comment.id) || 0
        })

        return {
            ...createPaginationResponse({
                data: rootComments,
                total: totalRootComments,
                query
            }),
            totalComments: totalComments,
        }
    }

    async getChildComments(parentId: string, query: FindCommentDto) {
        const queryOptions = createPaginationQueryOptions<CommentEntity>({
            query,
            options: {
                relations: ['reactions', 'author'],
                where: { parent_comment: { id: parentId } }
            }
        })

        // По умолчанию сортируем по дате создания (новые первыми)
        if (!query.sort_by) {
            queryOptions.order = { created_at: 'DESC' }
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

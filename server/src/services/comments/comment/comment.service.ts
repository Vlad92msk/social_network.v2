import { Injectable } from '@nestjs/common'
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

    async findPinnedComments(postId: string) {
        return this.commentRepository.find({
            where: { post: { id: postId }, is_pinned: true },
            relations: ['parent_comment', 'reactions']
        })
    }
}

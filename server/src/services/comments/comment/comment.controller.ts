import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus, Res,
} from '@nestjs/common'
import { CommentService } from './comment.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { UpdateCommentDto } from './dto/update-comment.dto'
import { FindCommentDto } from './dto/find-comment.dto'
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation, ApiResponse,
    ApiTags,
} from '@nestjs/swagger'
import { CommentEntity } from './entities/comment.entity'
import { createPaginationHeaders } from '@shared/utils'
import { RequestParams } from '@shared/decorators'
import { Response } from 'express'
import { CommentResponseDto } from './dto/comment-response.dto'

export type CommentTarget = 'post' | 'media'

@ApiTags('Комментарии')
@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @Post(':target/:entity_id')
    @ApiOperation({ summary: 'Создать комментарий' })
    @ApiCreatedResponse({ description: 'Комментарий успешно создан', type: CommentEntity })
    @ApiBadRequestResponse({ description: 'Переданы неверные данные' })
    create(
      @Param('target') target: CommentTarget,
      @Param('entity_id') entityId: string,
      @Body() createCommentDto: CreateCommentDto,
      @RequestParams() params: RequestParams
    ) {
        return this.commentService.create(createCommentDto, target, entityId, params)
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Обновить комментарий по ID' })
    @ApiOkResponse({ description: 'Комментарий успешно обновлен', type: CommentEntity })
    @ApiNotFoundResponse({ description: 'Комментарий не найден' })
    @ApiBadRequestResponse({ description: 'Переданы неверные данные' })
    async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
        return await this.commentService.update(id, updateCommentDto)
    }

    @Get('main/:target/:entity_id')
    @ApiOperation({ summary: 'Получить корневые комментарии к посту' })
    @ApiResponse({ status: 200, description: 'Список корневых комментариев к посту с общим количеством', type: CommentResponseDto })
    async findComments(
        @Param('target') target: CommentTarget,
        @Param('entity_id') entityId: string,
        @Query() query: FindCommentDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const result = await this.commentService.findCommentsByEntity(target, entityId, query, params)
        const { data, paginationInfo } = result

        response.set(createPaginationHeaders(paginationInfo))
        return { data: data.data, total: paginationInfo.total, totalComments: data.totalComments }
    }

    @Get('children/:parent_id')
    @ApiOperation({ summary: 'Получить дочерние комментарии' })
    @ApiResponse({ status: 200, description: 'Список дочерних комментариев', type: [CommentEntity] })
    async findChildComments(
        @Param('parent_id') id: string,
        @Query() query: FindCommentDto,
        @Res({ passthrough: true }) response: Response
    ) {
        const { data, paginationInfo } = await this.commentService.getChildComments(id, query)
        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Get()
    @ApiOperation({ summary: 'Получить список комментариев' })
    @ApiResponse({ status: 200, description: 'Список постов', type: [CommentEntity] })
    async findAll
    (
        @Query() query: FindCommentDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const { data, paginationInfo } = await this.commentService.findAll(query, params)

        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить комментарий по ID' })
    @ApiOkResponse({ description: 'Комментарий найден', type: CommentEntity })
    @ApiNotFoundResponse({ description: 'Комментарий не найден' })
    async findOne(@Param('id') id: string) {
        return this.commentService.findOne(id)
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить комментарий по ID' })
    @ApiNoContentResponse({ description: 'Комментарий успешно удален' })
    @ApiNotFoundResponse({ description: 'Комментарий не найден' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @RequestParams() params: RequestParams) {
        return await this.commentService.remove(id, params)
    }


    @Patch(':comment_id/pin')
    @ApiOperation({ summary: 'Закрепить/открепить комментарий' })
    @ApiOkResponse({ description: 'Комментарий успешно закреплен/откреплен', type: CommentEntity })
    @ApiNotFoundResponse({ description: 'Комментарий не найден' })
    async pinComment(
        @Param('comment_id') id: string,
        @RequestParams() params: RequestParams
    ) {
        return await this.commentService.pinComment(id, params.user_info_id)
    }

    @Get('post/:postId/pinned')
    @ApiOperation({ summary: 'Получить закрепленные комментарии' })
    @ApiOkResponse({ description: 'Закрепленные комментарии успешно получены', type: [CommentEntity] })
    @ApiNotFoundResponse({ description: 'Пост не найден' })
    findPinnedComments(@Param('postId') postId: string) {
        return this.commentService.findPinnedComments(postId)
    }
}

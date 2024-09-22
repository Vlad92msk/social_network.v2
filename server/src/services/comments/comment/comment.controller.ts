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

@ApiTags('Комментарии')
@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @Post()
    @ApiOperation({ summary: 'Создать комментарий' })
    @ApiCreatedResponse({ description: 'Комментарий успешно создан', type: CommentEntity })
    @ApiBadRequestResponse({ description: 'Переданы неверные данные' })
    create(
      @Body() createCommentDto: CreateCommentDto,
      @RequestParams() params: RequestParams
    ) {
        return this.commentService.create(createCommentDto, params)
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Обновить комментарий по ID' })
    @ApiOkResponse({ description: 'Комментарий успешно обновлен', type: CommentEntity })
    @ApiNotFoundResponse({ description: 'Комментарий не найден' })
    @ApiBadRequestResponse({ description: 'Переданы неверные данные' })
    async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
        return await this.commentService.update(id, updateCommentDto)
    }

    @Get('post/:post_id')
    @ApiOperation({ summary: 'Получить корневые комментарии к посту' })
    @ApiResponse({ status: 200, description: 'Список корневых комментариев к посту с общим количеством', type: CommentResponseDto })
    async findCommentsByPost(
        @Param('post_id') postId: string,
        @Query() query: FindCommentDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const result = await this.commentService.findCommentsByEntity('post', postId, query, params)
        const { data, paginationInfo } = result

        response.set(createPaginationHeaders(paginationInfo))
        return { data: data.data, total: paginationInfo.total, totalComments: data.totalComments }
    }

    @Get('media/:mediaId')
    @ApiOperation({ summary: 'Получить комментарии к медиа' })
    @ApiResponse({ status: 200, description: 'Список корневых комментариев к медиа с общим количеством', type: CommentResponseDto })
    async findCommentsByMedia(
        @Param('mediaId') mediaId: string,
        @Query() query: FindCommentDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const result = await this.commentService.findCommentsByEntity('post', mediaId, query, params)
        const { data, paginationInfo } = result

        response.set(createPaginationHeaders(paginationInfo))
        return { data, total: paginationInfo.total, totalComments: data }
    }

    @Get(':id/children')
    @ApiOperation({ summary: 'Получить дочерние комментарии' })
    @ApiResponse({ status: 200, description: 'Список дочерних комментариев', type: [CommentEntity] })
    async getChildComments(
        @Param('id') id: string,
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
    async remove(@Param('id') id: string) {
        return await this.commentService.remove(id)
    }

    @Patch(':id/pin')
    @ApiOperation({ summary: 'Закрепить/открепить комментарий' })
    @ApiOkResponse({ description: 'Комментарий успешно закреплен/откреплен', type: CommentEntity })
    @ApiNotFoundResponse({ description: 'Комментарий не найден' })
    async pinComment(
        @Param('id') id: string,
        @Body('action') action: 'pin' | 'unpin'
    ) {
        return await this.commentService.pinComment(id, action)
    }

    @Get('post/:postId/pinned')
    @ApiOperation({ summary: 'Получить закрепленные комментарии для поста' })
    @ApiOkResponse({ description: 'Закрепленные комментарии успешно получены', type: [CommentEntity] })
    @ApiNotFoundResponse({ description: 'Пост не найден' })
    findPinnedComments(@Param('postId') postId: string) {
        return this.commentService.findPinnedComments(postId)
    }
}

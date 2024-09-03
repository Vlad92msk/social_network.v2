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

@ApiTags('Комментарии')
@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @Post()
    @ApiOperation({ summary: 'Создать комментарий' })
    @ApiCreatedResponse({ description: 'Комментарий успешно создан', type: CommentEntity })
    @ApiBadRequestResponse({ description: 'Переданы неверные данные' })
    create(@Body() createCommentDto: CreateCommentDto) {
        return this.commentService.create(createCommentDto)
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

    @Patch(':id')
    @ApiOperation({ summary: 'Обновить комментарий по ID' })
    @ApiOkResponse({ description: 'Комментарий успешно обновлен', type: CommentEntity })
    @ApiNotFoundResponse({ description: 'Комментарий не найден' })
    @ApiBadRequestResponse({ description: 'Переданы неверные данные' })
    async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
        return await this.commentService.update(id, updateCommentDto)
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить комментарий по ID' })
    @ApiNoContentResponse({ description: 'Комментарий успешно удален' })
    @ApiNotFoundResponse({ description: 'Комментарий не найден' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        return await this.commentService.remove(id)
    }

    @Get('post/:postId/pinned')
    @ApiOperation({ summary: 'Получить закрепленные комментарии для поста' })
    @ApiOkResponse({ description: 'Закрепленные комментарии успешно получены', type: [CommentEntity] })
    @ApiNotFoundResponse({ description: 'Пост не найден' })
    findPinnedComments(@Param('postId') postId: string) {
        return this.commentService.findPinnedComments(postId)
    }
}

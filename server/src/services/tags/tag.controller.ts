import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, Res } from '@nestjs/common'
import { TagsService } from './tags.service'
import { CreateTagDto } from './dto/create-tag.dto'
import { UpdateTagDto } from './dto/update-tag.dto'
import { FindTagDto } from './dto/find-tag.dto'
import { createPaginationHeaders } from '@shared/utils'
import { RequestParams } from '@shared/decorators'
import { Response } from 'express'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'
import { Tag } from './entity'

@ApiTags('Теги')
@Controller('api/tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Создать тег' })
    @ApiBody({ type: CreateTagDto })
    @ApiResponse({ status: 201, description: 'Тег успешно создан', type: Tag })
    async createTag(@Body() createTagDto: CreateTagDto) {
        return await this.tagsService.createTag(createTagDto)
    }

    @Get()
    @ApiOperation({ summary: 'Найти теги' })
    @ApiQuery({ type: FindTagDto })
    @ApiResponse({ status: 200, description: 'Список тегов', type: [Tag] })
    async findTags(
        @Query() query: FindTagDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const { data, paginationInfo } = await this.tagsService.findTags(query, params)

        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Get(':id')
    @ApiOperation({ summary: 'Найти тег по ID' })
    @ApiParam({ name: 'id', description: 'ID тега' })
    @ApiResponse({ status: 200, description: 'Тег найден', type: Tag })
    async findTagById(@Param('id') id: string) {
        return await this.tagsService.findTagById(id)
    }

    @Put(':id')
    @ApiOperation({ summary: 'Обновить тег' })
    @ApiParam({ name: 'id', description: 'ID тега' })
    @ApiBody({ type: UpdateTagDto })
    @ApiResponse({ status: 200, description: 'Тег обновлен', type: Tag })
    async updateTag(
        @Param('id') id: string,
        @Body() updateTagDto: UpdateTagDto
    ) {
        return await this.tagsService.updateTag(id, updateTagDto)
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить тег' })
    @ApiParam({ name: 'id', description: 'ID тега' })
    @ApiResponse({ status: 204, description: 'Тег удален' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteTag(@Param('id') id: string) {
        await this.tagsService.deleteTag(id)
    }

    @Get('bulk')
    @ApiOperation({ summary: 'Найти теги по ID' })
    @ApiQuery({ name: 'ids', type: [String], description: 'Массив ID тегов' })
    @ApiResponse({ status: 200, description: 'Список найденных тегов', type: [Tag] })
    async findTagsByIds(
        @Query('ids') ids: string[],
        @RequestParams() params: RequestParams,
    ) {
        return await this.tagsService.findTagsByIds(ids)
    }
}

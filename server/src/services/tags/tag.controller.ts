import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, Res } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { FindTagDto } from './dto/find-tag.dto';
import { createPaginationHeaders } from "@shared/utils";
import { RequestParams } from "@shared/decorators";
import { Response } from "express";

@Controller('api/tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    /**
     * Создать тег
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createTag(@Body() createTagDto: CreateTagDto) {
        return await this.tagsService.createTag(createTagDto);
    }

    /**
     * Найти теги
     */
    @Get()
    async findTags(
        @Query() query: FindTagDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const { data, paginationInfo } = await this.tagsService.findTags(query, params)

        response.set(createPaginationHeaders(paginationInfo));
        return data;
    }

    /**
     *  Найти тег по ID
     */
    @Get(':id')
    async findTagById(@Param('id') id: string) {
        return await this.tagsService.findTagById(id);
    }

    /**
     * Обновить тег
     */
    @Put(':id')
    async updateTag(
        @Param('id') id: string,
        @Body() updateTagDto: UpdateTagDto
    ) {
        return await this.tagsService.updateTag(id, updateTagDto);
    }

    /**
     * Удалить тег
     */
    @Delete(':id')
    async deleteTag(@Param('id') id: string) {
        await this.tagsService.deleteTag(id);
    }

    /**
     * Найти теги по id
     */
    @Get('bulk')
    async findTagsByIds(
        @Query() query: { ids: string[] },
        @RequestParams() params: RequestParams,
    ) {
        return await this.tagsService.findTagsByIds(query.ids);
    }
}

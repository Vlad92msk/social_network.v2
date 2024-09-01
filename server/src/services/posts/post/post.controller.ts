import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseInterceptors,
    UploadedFiles,
    Query,
    Res
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RequestParams } from '@shared/decorators';
import { PostVisibility } from "@shared/entity/publication.entity";
import { PostsService } from "@services/posts/post/post.service";
import { ConfigService } from "@nestjs/config";
import { ConfigEnum } from "@config/config.enum";
import { MediaInfoService } from "@services/media/info/media-info.service";
import { Response } from "express";
import { FindPostDto } from "@services/posts/post/dto/find-post.dto";
import { createPaginationHeaders } from "@shared/utils";

@Controller('api/posts')
export class PostsController {
    private readonly maxStorage: number

    constructor(
        private readonly postsService: PostsService,
        private readonly mediaInfoService: MediaInfoService,
        private readonly configService: ConfigService,
    ) {
        // Доступно места для загрузки
        this.maxStorage = this.configService.get(`${ConfigEnum.MAIN}.maxUserStorage`)
    }

    /**
     * Создать
     */
    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'media', maxCount: 20 },
        { name: 'voices', maxCount: 5 },
        { name: 'videos', maxCount: 5 }
    ]))
    async create(
        @Body() createPostDto: CreatePostDto,
        @UploadedFiles() files: {
            media?: Express.Multer.File[],
            voices?: Express.Multer.File[],
            videos?: Express.Multer.File[]
        },
        @RequestParams() params: RequestParams,
    ) {
        // Проверяем квоту
        await this.mediaInfoService.checkStorageLimit(
            params.user_info_id, [].concat(files?.media, files?.voices, files?.videos),
            this.maxStorage
        )

        return await this.postsService.create({
            createPostDto,
            media: files?.media,
            voices: files?.voices,
            videos: files?.videos
        },
            params
        );
    }

    /**
     * Найти все
     */
    @Get()
    async findAll(
        @Query() query: FindPostDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ) {
        const { data, paginationInfo } = await this.postsService.findAll(query, params)

        response.set(createPaginationHeaders(paginationInfo));
        return data;
    }

    /**
     * Найти пост по ID
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.postsService.findOne(id);
    }

    /**
     * Изменить пост по ID
     */
    @Patch(':id')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'media', maxCount: 20 },
        { name: 'voices', maxCount: 5 },
        { name: 'videos', maxCount: 5 }
    ]))
    async update(
        @Param('id') id: string,
        @Body() updatePostDto: UpdatePostDto,
        @UploadedFiles() files: {
            media?: Express.Multer.File[],
            voices?: Express.Multer.File[],
            videos?: Express.Multer.File[]
        },
        @RequestParams() params: RequestParams
    ) {
        // Проверяем квоту
        await this.mediaInfoService.checkStorageLimit(
            params.user_info_id, [].concat(files?.media, files?.voices, files?.videos),
            this.maxStorage
        )

        return await this.postsService.update(
            id,
            {
                updatePostDto,
                media: files?.media,
                voices: files?.voices,
                videos: files?.videos
            },
            params.user_info_id
        );
    }

    /**
     * Удалить пост по ID
     */
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.postsService.remove(id);
    }

    /**
     * Создание репоста
     */
    @Post(':id/repost')
    async createRepost(
        @Param('id') id: string,
        @Body('text') text: string,
        @RequestParams() params: RequestParams
    ) {
        return await this.postsService.createRepost(id, params, text);
    }

    /**
     * Создание ответа на пост
     */
    @Post(':id/reply')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'media', maxCount: 20 },
        { name: 'voices', maxCount: 5 },
        { name: 'videos', maxCount: 5 }
    ]))
    async createReply(
        @Param('id') id: string,
        @Body() createPostDto: CreatePostDto,
        @UploadedFiles() files: {
            media?: Express.Multer.File[],
            voices?: Express.Multer.File[],
            videos?: Express.Multer.File[]
        },
        @RequestParams() params: RequestParams
    ) {
        // Проверяем квоту
        await this.mediaInfoService.checkStorageLimit(
            params.user_info_id, [].concat(files?.media, files?.voices, files?.videos),
            this.maxStorage
        )

        return await this.postsService.createReply(
            id,
            {
                createPostDto,
                media: files?.media,
                voices: files?.voices,
                videos: files?.videos
            },
            params
        );
    }

    /**
     * Получение закрепленных постов
     */
    @Get('pinned')
    async getPinnedPosts(@RequestParams() params: RequestParams) {
        return await this.postsService.getPinnedPosts(params.user_info_id);
    }

    /**
     * Закрепление/открепление поста
     */
    @Patch(':id/pin')
    async togglePinPost(@Param('id') id: string, @RequestParams() params: RequestParams) {
        return await this.postsService.togglePinPost(id, params.user_info_id);
    }

    /**
     * Изменение видимости поста
     */
    @Patch(':id/visibility')
    async updatePostVisibility(
        @Param('id') id: string,
        @Body('visibility') visibility: PostVisibility,
        @RequestParams() params: RequestParams
    ) {
        return await this.postsService.updatePostVisibility(id, visibility, params.user_info_id);
    }

    /**
     * Создание пересылки поста
     */
    @Post(':id/forward')
    async createForwardedPost(
        @Param('id') id: string,
        @Body('text') text: string,
        @RequestParams() params: RequestParams
    ) {
        return await this.postsService.createForwardedPost(id, params, text);
    }

    /**
     * Получение всех медиафайлов поста (включая голосовые и видео)
     */
    @Get(':id/media')
    async getAllMediaForPost(@Param('id') id: string) {
        return await this.postsService.getAllMediaForPost(id);
    }

    /**
     * Обновление местоположения поста
     */
    @Patch(':id/location')
    async updatePostLocation(
        @Param('id') id: string,
        @Body('location') location: string,
        @RequestParams() params: RequestParams
    ) {
        return await this.postsService.updatePostLocation(id, location, params.user_info_id);
    }

    /**
     * Получение постов по местоположению
     */
    @Get('by-location')
    async getPostsByLocation(@Query('location') location: string) {
        return await this.postsService.getPostsByLocation(location);
    }

    /**
     * Получение репостов конкретного поста
     */
    @Get(':id/reposts')
    async getRepostsOfPost(@Param('id') id: string) {
        return await this.postsService.getRepostsOfPost(id);
    }

    /**
     * Получение ответов на конкретный пост
     */
    @Get(':id/replies')
    async getRepliesOfPost(@Param('id') id: string) {
        return await this.postsService.getRepliesOfPost(id);
    }

    /**
     * Получение пересылок конкретного поста
     */
    @Get(':id/forwards')
    async getForwardsOfPost(@Param('id') id: string) {
        return await this.postsService.getForwardsOfPost(id);
    }

    /**
     * Получение всех связанных постов (репосты, ответы, пересылки)
     */
    @Get(':id/related')
   async getAllRelatedPosts(@Param('id') id: string) {
        return await this.postsService.getAllRelatedPosts(id);
    }

    /**
     * Получение цепочки ответов
     */
    @Get(':id/reply-chain')
    async getReplyChain(@Param('id') id: string) {
        return await this.postsService.getReplyChain(id);
    }

    /**
     * Увеличение счетчика просмотров
     */
    @Post(':id/increment-view')
    async incrementViewCount(@Param('id') id: string) {
        return await this.postsService.incrementViewCount(id);
    }
}

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
} from '@nestjs/common'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { RequestParams } from '@shared/decorators'
import { PostsService } from '@services/posts/post/post.service'
import { ConfigService } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { Response } from 'express'
import { FindPostDto } from '@services/posts/post/dto/find-post.dto'
import { createPaginationHeaders } from '@shared/utils'
import { PostEntity, PostVisibility } from '@services/posts/post/entities/post.entity'
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'

@ApiTags('Посты')
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

    @Post()
    @ApiOperation({ summary: 'Создать пост' })
    @ApiResponse({ status: 200, description: 'Пост успешно создан', type: PostEntity })
    @ApiConsumes('multipart/form-data')
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
        console.log('files__', files)
        // Проверяем квоту
        await this.mediaInfoService.checkStorageLimit(
            params.user_info_id,
            [].concat(files?.media, files?.voices, files?.videos).filter(Boolean),
            this.maxStorage
        )

        // return {}
        return await this.postsService.create({
            createPostDto,
            media: files?.media,
            voices: files?.voices,
            videos: files?.videos
        },
            params
        )
    }

    @Get()
    @ApiOperation({ summary: 'Найти все посты' })
    @ApiResponse({ status: 200, description: 'Список постов', type: [PostEntity] })
    async findAll(
        @Query() query: FindPostDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ): Promise<PostEntity[]> {
        const { data, paginationInfo } = await this.postsService.findAll(query, params)

        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Get(':id')
    @ApiOperation({ summary: 'Найти пост по ID' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Пост найден', type: PostEntity })
    async findOne(@Param('id') id: string) {
        return await this.postsService.findOne(id)
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Изменить пост по ID' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Пост успешно обновлен', type: PostEntity })
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
        )
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удалить пост по ID' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Пост успешно удален' })
    async remove(@Param('id') id: string) {
        return await this.postsService.remove(id)
    }

    @Post(':id/repost')
    @ApiOperation({ summary: 'Создание репоста' })
    @ApiParam({ name: 'id', description: 'ID оригинального поста' })
    @ApiBody({ description: 'Текст репоста', type: String })
    @ApiResponse({ status: 200, description: 'Репост успешно создан', type: PostEntity })
    async createRepost(
        @Param('id') id: string,
        @Body('text') text: string,
        @RequestParams() params: RequestParams
    ) {
        return await this.postsService.createRepost(id, params, text)
    }

    @Post(':id/reply')
    @ApiOperation({ summary: 'Создание ответа на пост' })
    @ApiParam({ name: 'id', description: 'ID поста, на который отвечаем' })
    @ApiResponse({ status: 200, description: 'Ответ успешно создан', type: PostEntity })
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
        )
    }

    @Get('pinned')
    @ApiOperation({ summary: 'Получение закрепленных постов' })
    @ApiResponse({ status: 200, description: 'Список закрепленных постов', type: [PostEntity] })
    async getPinnedPosts(@RequestParams() params: RequestParams) {
        return await this.postsService.getPinnedPosts(params.user_info_id)
    }

    @Patch(':id/pin')
    @ApiOperation({ summary: 'Закрепление/открепление поста' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Статус закрепления поста обновлен', type: PostEntity })
    async togglePinPost(@Param('id') id: string, @RequestParams() params: RequestParams) {
        return await this.postsService.togglePinPost(id, params.user_info_id)
    }

    @Patch(':id/visibility')
    @ApiOperation({ summary: 'Изменение видимости поста' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiBody({ description: 'Новый уровень видимости', enum: PostVisibility })
    @ApiResponse({ status: 200, description: 'Видимость поста обновлена', type: PostEntity })
    async updatePostVisibility(
        @Param('id') id: string,
        @Body('visibility') visibility: PostVisibility,
        @RequestParams() params: RequestParams
    ) {
        return await this.postsService.updatePostVisibility(id, visibility, params.user_info_id)
    }

    @Post(':id/forward')
    @ApiOperation({ summary: 'Создание пересылки поста' })
    @ApiParam({ name: 'id', description: 'ID пересылаемого поста' })
    @ApiBody({ description: 'Текст пересылки', type: String })
    @ApiResponse({ status: 200, description: 'Пересылка успешно создана', type: PostEntity })
    async createForwardedPost(
        @Param('id') id: string,
        @Body('text') text: string,
        @RequestParams() params: RequestParams
    ) {
        return await this.postsService.createForwardedPost(id, params, text)
    }

    @Get(':id/media')
    @ApiOperation({ summary: 'Получение всех медиафайлов поста' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Список медиафайлов поста', type: [Object] })
    async getAllMediaForPost(@Param('id') id: string) {
        return await this.postsService.getAllMediaForPost(id)
    }

    @Patch(':id/location')
    @ApiOperation({ summary: 'Обновление местоположения поста' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiBody({ description: 'Новое местоположение', type: String })
    @ApiResponse({ status: 200, description: 'Местоположение поста обновлено', type: PostEntity })
    async updatePostLocation(
        @Param('id') id: string,
        @Body('location') location: string,
        @RequestParams() params: RequestParams
    ) {
        return await this.postsService.updatePostLocation(id, location, params.user_info_id)
    }

    @Get('by-location')
    @ApiOperation({ summary: 'Получение постов по местоположению' })
    @ApiQuery({ name: 'location', description: 'Местоположение для поиска' })
    @ApiResponse({ status: 200, description: 'Список постов по местоположению', type: [PostEntity] })
    async getPostsByLocation(@Query('location') location: string) {
        return await this.postsService.getPostsByLocation(location)
    }

    @Get(':id/reposts')
    @ApiOperation({ summary: 'Получение репостов конкретного поста' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Список репостов', type: [PostEntity] })
    async getRepostsOfPost(@Param('id') id: string) {
        return await this.postsService.getRepostsOfPost(id)
    }

    @Get(':id/replies')
    @ApiOperation({ summary: 'Получение ответов на конкретный пост' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Список ответов', type: [PostEntity] })
    async getRepliesOfPost(@Param('id') id: string) {
        return await this.postsService.getRepliesOfPost(id)
    }

    @Get(':id/forwards')
    @ApiOperation({ summary: 'Получение пересылок конкретного поста' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Список пересылок', type: [PostEntity] })
    async getForwardsOfPost(@Param('id') id: string) {
        return await this.postsService.getForwardsOfPost(id)
    }

    @Get(':id/related')
    @ApiOperation({ summary: 'Получение всех связанных постов' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Список связанных постов', type: [PostEntity] })
   async getAllRelatedPosts(@Param('id') id: string) {
        return await this.postsService.getAllRelatedPosts(id)
    }

    @Get(':id/reply-chain')
    @ApiOperation({ summary: 'Получение цепочки ответов' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Цепочка ответов', type: [PostEntity] })
    async getReplyChain(@Param('id') id: string) {
        return await this.postsService.getReplyChain(id)
    }

    @Post(':id/increment-view')
    @ApiOperation({ summary: 'Увеличение счетчика просмотров' })
    @ApiParam({ name: 'id', description: 'ID поста' })
    @ApiResponse({ status: 200, description: 'Счетчик просмотров обновлен', type: PostEntity })
    async incrementViewCount(@Param('id') id: string) {
        return await this.postsService.incrementViewCount(id)
    }
}

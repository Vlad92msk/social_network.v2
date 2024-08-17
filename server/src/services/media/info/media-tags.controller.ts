import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common';
import { MediaInfoService } from './media-info.service';

@Controller('api/media/tags')
export class MediaTagsController {
    constructor(private readonly mediaInfoService: MediaInfoService) {}

    /**
     * Добавить теги к медиа
     */
    @Post(':media_id')
    async addTagsToMedia(
        @Param('media_id') id: string,
        @Body() tag_ids: string[]
    ) {
        return this.mediaInfoService.addTagsToMedia(id, tag_ids)
    }

    /**
     * Удалить теги с медиа:
     */
    @Delete(':media_id')
    async removeTagsFromMedia(
        @Param('media_id') id: string,
        @Body() tag_ids: string[]
    ) {
        return this.mediaInfoService.removeTagsFromMedia(id, tag_ids)
    }

    /**
     * Получить все теги медиа
     */
    @Get(':media_id')
    async getMediaTags(@Param('media_id') id: string) {
        return this.mediaInfoService.getMediaTags(id)
    }
}

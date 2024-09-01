import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common'
import { MediaTagService } from '@services/media/info/media-tag.service'

@Controller('api/media/tags')
export class MediaTagsController {
    constructor(private readonly mediaInfoService: MediaTagService) {}

    /**
     * Добавить теги к медиа
     */
    @Post(':media_id')
    async addTagsToMedia(
        @Param('media_id') media_id: string,
        @Body() body: { tag_ids: string[] }
    ) {
        return this.mediaInfoService.addTagsToMedia(media_id, body.tag_ids)
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

import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common'
import { MediaTagService } from '@services/media/info/media-tag.service'
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { Tag } from '@services/tags/entity'

@ApiTags('Теги медиа')
@Controller('api/media/tags')
export class MediaTagsController {
    constructor(private readonly mediaInfoService: MediaTagService) {}

    @Post(':media_id')
    @ApiOperation({ summary: 'Добавить теги к медиа' })
    @ApiParam({ name: 'media_id', description: 'ID медиа' })
    @ApiBody({ schema: { type: 'object', properties: { tag_ids: { type: 'array', items: { type: 'string' } } } } })
    @ApiResponse({ status: 200, description: 'Теги успешно добавлены', type: MediaEntity })
    async addTagsToMedia(
        @Param('media_id') media_id: string,
        @Body() body: { tag_ids: string[] }
    ) {
        return this.mediaInfoService.addTagsToMedia(media_id, body.tag_ids)
    }

    @Delete(':media_id')
    @ApiOperation({ summary: 'Удалить теги с медиа' })
    @ApiParam({ name: 'media_id', description: 'ID медиа' })
    @ApiBody({ schema: { type: 'array', items: { type: 'string' } } })
    @ApiResponse({ status: 200, description: 'Теги успешно удалены', type: MediaEntity })
    async removeTagsFromMedia(
        @Param('media_id') id: string,
        @Body() tag_ids: string[]
    ) {
        return this.mediaInfoService.removeTagsFromMedia(id, tag_ids)
    }

    @Get(':media_id')
    @ApiOperation({ summary: 'Получить все теги медиа' })
    @ApiParam({ name: 'media_id', description: 'ID медиа' })
    @ApiResponse({ status: 200, description: 'Список тегов медиа', type: [Tag] })
    async getMediaTags(@Param('media_id') id: string) {
        return this.mediaInfoService.getMediaTags(id)
    }
}
